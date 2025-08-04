import { Component, AfterViewInit, ChangeDetectorRef, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import Chart from 'chart.js/auto';
import { EmployeeService } from '../../Services/employee-service';
import { DepartmentService } from '../../Services/department-service';
import { AttendanceService } from '../../Services/attendance-service';
import { Subscription } from 'rxjs';
import { IDepartment } from '../../Interfaces/idepartment';
import { TasksService } from '../../Services/tasks-service';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { AuthService } from '../../Services/auth-service';
import { IEmployee } from '../../Interfaces/iemployee';
import Swal from 'sweetalert2';
import { IAttendance } from '../../Interfaces/iattendance';

@Component({
  selector: 'app-hr-dashboard',
  imports: [CommonModule, NgxSpinnerModule],
  templateUrl: './hr-dashboard.html',
  styleUrl: './hr-dashboard.css'
})
export class HRDashboard implements AfterViewInit, OnInit, OnDestroy {
  constructor(
    private employeeService: EmployeeService,
    private departmentService: DepartmentService,
    private attendanceService: AttendanceService,
    private tasksService: TasksService,
    private cdr: ChangeDetectorRef,
    private spinner: NgxSpinnerService,
    private authService: AuthService,
  ) {}


  totalEmployees: number = 0;
  totalDepartments: number = 0;
  attendanceToday: number = 0;
  absenteesToday: number = 0;
  subs:Subscription[] = [];
  @ViewChild('attendanceChartCanvas') attendanceChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('performanceChartCanvas') performanceChartCanvas!: ElementRef<HTMLCanvasElement>;

  attendanceData: any[] = [];
  attendanceChart: Chart | null = null;
  performanceChart: Chart | null = null;
  viewInitialized = false;
  attendanceLoaded = false;
  departments: IDepartment[] = [];
  allTasks: any[] = [];
  userId:number = 0;
  myData!:IEmployee;
  userRole:string="";
  todayAttendance: IAttendance | null = null;
  attendanceStatus: 'not_checked_in' | 'checked_in' | 'checked_out' = 'not_checked_in';


  ngOnInit(): void {
    this.spinner.show();
    
    this.subs.push(this.authService.userId.subscribe({
      next: (resp) => {
        console.log(resp);
          this.userId = this.authService.userId.getValue() || 0;
          if(this.userId!=0){
            this.userRole = this.authService.getRole()||"";
            this.getEmployee(this.userId);
            console.log("userRole", this.userRole);
          }
        this.cdr.detectChanges();
      }
    }));

    this.subs.push(this.employeeService.getEmployees().subscribe({
      next: (employees) => {
        this.totalEmployees = employees.length;
        this.cdr.detectChanges();
      }
    }));

    this.subs.push(this.departmentService.getDepartments().subscribe({
      next: (departments) => {
        this.departments = departments.filter(d=>d.departmentName!="HR");
        this.totalDepartments = departments.length;
        this.cdr.detectChanges();
      }
    }));

    this.subs.push(this.attendanceService.getAttendances().subscribe({
      next: (attendances) => {
        this.attendanceData = attendances;
        this.attendanceLoaded = true;
        this.updateAttendanceStatsAndChart();
      }
    }));
    
    this.subs.push(this.tasksService.getAllTasks().subscribe({
      next: (tasks) => {
        this.allTasks = tasks || [];
        this.createPerformanceChart();
      },
      error: (err) => {
        this.spinner.hide();
      },
      complete: () => {
        this.spinner.hide();
      }
    }));
  }

  getEmployee(id:number){
    this.subs.push(this.employeeService.getEmployeeById(id).subscribe({
      next: (resp) => {        
        this.myData = resp;
        this.getAttendance();
        this.cdr.detectChanges();
      }
    }));
    
  }

  ngAfterViewInit() {
    this.viewInitialized = true;
    this.updateAttendanceStatsAndChart();
    this.createPerformanceChart();
  }

  updateAttendanceStatsAndChart() {
    if (!this.viewInitialized || !this.attendanceLoaded) return;
    const attendances = this.attendanceData;
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10); // 'YYYY-MM-DD'
    
    // Calculate new attendance count
    const newAttendanceToday = attendances.filter(a => a.attendanceDate.slice(0, 10) === todayStr).length;
    const newAbsenteesToday = this.totalEmployees - newAttendanceToday;
    
    // Update the values with a small animation effect
    if (this.attendanceToday !== newAttendanceToday) {
      this.attendanceToday = newAttendanceToday;
    }
    if (this.absenteesToday !== newAbsenteesToday) {
      this.absenteesToday = newAbsenteesToday;
    }
    
    // --- Dynamic Attendance Chart Data (skip Friday/Saturday) ---
    function isWeekend(date: Date) {
      // 5 = Friday, 6 = Saturday
      return date.getDay() === 5 || date.getDay() === 6;
    }
    // Get last N working days (excluding Fri/Sat), ending with today or most recent working day
    function getLastNWorkingDays(n: number, endDate: Date) {
      const days: string[] = [];
      let d = new Date(endDate);
      while (days.length < n) {
        if (!isWeekend(d)) {
          days.unshift(d.toISOString().slice(0, 10));
        }
        d.setDate(d.getDate() - 1);
      }
      return days;
    }
    // Helper to get weekday short name
    function getWeekdayShort(dateStr: string) {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { weekday: 'short' });
    }
    // Last 5 working days (ending with today or most recent working day)
    const last5Days = getLastNWorkingDays(5, today);
    const last5Labels = last5Days.map(getWeekdayShort);
    // Current week data
    const currentWeekData = last5Days.map(dateStr =>
      attendances.filter(a => a.attendanceDate.slice(0, 10) === dateStr).length
    );
    // Previous week (same weekdays, but 7 days earlier)
    const prev5Days = last5Days.map(dateStr => {
      const d = new Date(dateStr);
      d.setDate(d.getDate() - 7);
      // If the mapped day is a weekend, keep subtracting until a working day
      while (isWeekend(d)) {
        d.setDate(d.getDate() - 1);
      }
      return d.toISOString().slice(0, 10);
    });
    const prevWeekData = prev5Days.map(dateStr =>
      attendances.filter(a => a.attendanceDate.slice(0, 10) === dateStr).length
    );
    
    // Update chart with smooth transition
    this.updateAttendanceChart(last5Labels, currentWeekData, prevWeekData);
    
    this.cdr.detectChanges();
  }

  // Separate method to update the attendance chart
  private updateAttendanceChart(labels: string[], currentWeekData: number[], prevWeekData: number[]) {
    // Destroy previous chart if exists
    if (this.attendanceChart) {
      this.attendanceChart.destroy();
    }
    // Create chart only if canvas is available
    if (this.attendanceChartCanvas && this.attendanceChartCanvas.nativeElement) {
      this.attendanceChart = new Chart(this.attendanceChartCanvas.nativeElement, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Current Week',
              data: currentWeekData,
              borderColor: '#3b82f6',
              backgroundColor: 'rgba(59,130,246,0.08)',
              tension: 0.4,
              fill: true,
              pointRadius: 3
            },
            {
              label: 'Last Week',
              data: prevWeekData,
              borderColor: '#f59e42',
              backgroundColor: 'rgba(245,158,66,0.08)',
              tension: 0.4,
              fill: true,
              pointRadius: 3
            }
          ]
        },
        options: {
          plugins: { legend: { display: true } },
          responsive: true,
          maintainAspectRatio: false,
          animation: {
            duration: 1000,
            easing: 'easeInOutQuart'
          },
          scales: {
            y: { beginAtZero: true, grid: { color: '#f3f3f3' } },
            x: { grid: { color: '#f3f3f3' } }
          }
        }
      });
    }
  }

  createPerformanceChart() {
    // Destroy previous chart if exists
    if (this.performanceChart) {
      this.performanceChart.destroy();
    }
    // Prepare department names
    const departmentNames = this.departments.map(d => d.departmentName);
    // Prepare done and pending counts for each department
    const doneCounts = departmentNames.map(name =>
      this.allTasks.filter(t => t.departmentName === name && t.status === 'Done').length
    );
    const pendingCounts = departmentNames.map(name =>
      this.allTasks.filter(t => t.departmentName === name && t.status === 'Pending').length
    );
    const lateCounts = departmentNames.map(name =>
      this.allTasks.filter(t => t.departmentName === name && t.status === 'Late').length
    );
    if (this.performanceChartCanvas && this.performanceChartCanvas.nativeElement) {
      this.performanceChart = new Chart(this.performanceChartCanvas.nativeElement, {
        type: 'bar',
        data: {
          labels: departmentNames,
          datasets: [
            {
              label: 'Done Tasks',
              data: doneCounts,
              backgroundColor: '#45a049',
              borderRadius: 8,
              barPercentage: 0.5
            },
            {
              label: 'Pending Tasks',
              data: pendingCounts,
              backgroundColor: '#3b82f6',
              borderRadius: 8,
              barPercentage: 0.5
            },
            {
              label: 'Late Tasks',
              data: lateCounts,
              backgroundColor: '#dc3545',
              borderRadius: 8,
              barPercentage: 0.5
            }
          ]
        },
        options: {
          indexAxis: 'y',
          plugins: { legend: { display: true } },
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { beginAtZero: true, grid: { color: '#f3f3f3' } },
            y: { grid: { color: '#f3f3f3' } }
          }
        }
      });
    }
    this.cdr.detectChanges();
  }

  getAttendance() {
    this.subs.push(this.attendanceService.getAttendanceForEmployee().subscribe({
      next: (attendance) => {
        this.attendanceData = attendance;
        this.setTodayAttendanceStatus();
        this.cdr.detectChanges();
      }
    }));
  }

  setTodayAttendanceStatus() {
    const todayStr = new Date().toLocaleDateString('en-CA');
    console.log("todayStr", todayStr);
    this.todayAttendance = this.attendanceData.find(a => a.attendanceDate && new Date(a.attendanceDate).toLocaleDateString('en-CA') === todayStr) || null;
    if (!this.todayAttendance) {
      this.attendanceStatus = 'not_checked_in';
    } else if (this.todayAttendance && this.todayAttendance.checkInTime && !this.todayAttendance.checkOutTime) {
      this.attendanceStatus = 'checked_in';
    } else if (this.todayAttendance && this.todayAttendance.checkOutTime ) {
      this.attendanceStatus = 'checked_out';
    }
    // console.log("todayAttendance", this.todayAttendance);
  }

  private getCurrentTimeString(): string {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  }

  checkIn() {
    if (!this.myData) return;
    this.spinner.show();
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const attendance: any = {
          employeeId: this.myData.employeeId,
          checkInTime: this.getCurrentTimeString(),
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
        console.log("attendance", attendance);
        this.attendanceService.checkIn(attendance).subscribe({
          next: (resp) => {
            this.getAttendance();
            this.refreshAttendanceData(); // Add this line to refresh attendance data
            Swal.fire({
              title: "Success!",
              text: "You have checked in successfully. Attendance data has been updated.",
              icon: "success",
              timer: 1500,
              showConfirmButton: false,
            });
          },
          error: (err) => {
            this.spinner.hide();
            if (err.error.message == "You are outside the allowed location range.") {
              Swal.fire({
                title: "Error!",
                text: "You are outside the allowed location range.",
                icon: "error",
              });
            }
            else if (err.error.message == "Invalid check-in or check-out time.") {
              Swal.fire({
                title: "Error!",
                text: "Invalid check-in or check-out time.",
                icon: "error",
              });
            }
            else {
              Swal.fire({
                title: "Error!",
                text: "Something went wrong. Please try again.",
                icon: "error",
              });
            }
          },
          complete: () => {
            this.updateAttendanceStatsAndChart();
            this.cdr.detectChanges();
            this.spinner.hide();
          }
        });
      },
      (error) => {
        this.spinner.hide();
        Swal.fire({
          title: "Error!",
          text: "Could not get your location. Please allow location access to check in.",
          icon: "error"
        });
      }
    );
  }

  checkOut() {
    if (!this.myData) return;
    this.spinner.show();
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const attendance: any = {
          employeeId: this.myData.employeeId,
          checkOutTime: this.getCurrentTimeString(),
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
        console.log("attendance", attendance);
        this.attendanceService.checkOut(attendance).subscribe({
          next: (resp) => {
            this.getAttendance();
            this.refreshAttendanceData(); // Add this line to refresh attendance data
            Swal.fire({
              title: "Success!",
              text: "You have checked out successfully. Attendance data has been updated.",
              icon: "success",
              timer: 1500,
              showConfirmButton: false,
            });
          },
          error: (err) => {
            this.spinner.hide();
            if (err.error.message == "You are outside the allowed location range.") {
              Swal.fire({
                title: "Error!",
                text: "You are outside the allowed location range.",
                icon: "error",
                
              });
            }
            else if (err.error.message == "Invalid check-in or check-out time.") {
              Swal.fire({
                title: "Error!",
                text: "Invalid check-in or check-out time.",
                icon: "error",
              });
            }
            else {
              Swal.fire({
                title: "Error!",
                text: "Something went wrong. Please try again.",
                icon: "error",
              });
            }
          },
          complete: () => {
            this.cdr.detectChanges();
            this.spinner.hide();
          }
        });
      },
      (error) => {
        this.spinner.hide();
        Swal.fire({
          title: "Error!",
          text: "Could not get your location. Please allow location access to check out.",
          icon: "error"
        });
      }
    );
  }

  // Add this new method to refresh attendance data
  refreshAttendanceData() {
    // Add a small delay to ensure backend has processed the check-in/check-out
    setTimeout(() => {
      this.subs.push(this.attendanceService.getAttendances().subscribe({
        next: (attendances) => {
          this.attendanceData = attendances;
          this.attendanceLoaded = true;
          this.updateAttendanceStatsAndChart();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error refreshing attendance data:', err);
        }
      }));
    }, 500); // 500ms delay to ensure backend processing
  }

  // Public method to manually refresh attendance data
  public refreshAttendanceStats() {
    this.refreshAttendanceData();
  }

  

  ngOnDestroy(): void {
    this.subs.forEach(sub => sub.unsubscribe());
    if (this.attendanceChart) this.attendanceChart.destroy();
    if (this.performanceChart) this.performanceChart.destroy();
  }


} 