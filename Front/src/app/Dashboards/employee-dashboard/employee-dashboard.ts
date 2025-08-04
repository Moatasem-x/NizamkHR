import { Component, AfterViewInit, ChangeDetectorRef, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {Chart} from 'chart.js/auto';
import { AuthService } from '../../Services/auth-service';
import { EmployeeService } from '../../Services/employee-service';
import { IEmployee } from '../../Interfaces/iemployee';
import { Subscription } from 'rxjs';
import { AttendanceService } from '../../Services/attendance-service';
import { IAttendance } from '../../Interfaces/iattendance';
import { RequestHolidayService } from '../../Services/request-holiday-service';
import { SalaryReportService } from '../../Services/salary-report-service';
import { ISalaryReport } from '../../Interfaces/isalary-report';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { TasksService } from '../../Services/tasks-service';
import { ITask } from '../../Interfaces/itask';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';

const chartFont = { size: 16, family: 'Inter, Arial, sans-serif' };
const chartFontColor = '#111';

@Component({
  selector: 'app-employee-dashboard',
  imports: [CommonModule, ReactiveFormsModule, NgxSpinnerModule],
  templateUrl: './employee-dashboard.html',
  styleUrl: './employee-dashboard.css'
})
export class EmployeeDashboard implements AfterViewInit, OnInit, OnDestroy {

  constructor(
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private employeeService: EmployeeService,
    private attendanceService: AttendanceService,
    private requestHolidayService: RequestHolidayService,
    private salaryReportService: SalaryReportService,
    private fb: FormBuilder,
    private tasksService: TasksService,
    private spinner: NgxSpinnerService
  ) {}

  employee!: IEmployee;
  subs: Subscription[] = [];
  attendanceData: IAttendance[] = [];
  salaryData!: ISalaryReport;
  pendingLeaves: number = 0;
  pendingTasks: number = 0;
  employeeTasks: ITask[] = [];
  attendanceChart: Chart | null = null;
  salaryChart: Chart | null = null;
  tasksChart: Chart | null = null;
  totalAttendancesThisMonth: number = 0;
  totalAbsencesThisMonth: number = 0;
  todayAttendance: IAttendance | null = null;
  attendanceStatus: 'not_checked_in' | 'checked_in' | 'checked_out' = 'not_checked_in';
  @ViewChild('attendanceChartCanvas') attendanceChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('salaryChartCanvas') salaryChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('tasksChartCanvas') tasksChartCanvas!: ElementRef<HTMLCanvasElement>;
  viewInitialized = false;

  ngOnInit(): void {
    this.spinner.show();
    this.getEmployee();
    this.cdr.detectChanges();
  }

  ngAfterViewInit() {
    this.viewInitialized = true;
    this.updateAttendanceChart();
    this.updateTasksChart();
  }

  getEmployee() {
    this.subs.push(this.employeeService.getCurrentEmployee().subscribe({
      next: (employee) => {
        this.employee = employee;
        this.getSalaryReport();
        this.getPendingLeaves();
        this.getAttendance();
        this.loadEmployeeTasks();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.spinner.hide();
      },
      complete: () => {
        this.spinner.hide();
      }
    }));
  }

  loadEmployeeTasks() {
    if (!this.employee?.employeeId) return;
    this.subs.push(this.tasksService.getTasksByEmployeeId(this.employee.employeeId).subscribe({
      next: (tasks) => {
        this.employeeTasks = tasks || [];
        this.pendingTasks = this.employeeTasks.filter(t => t.status == 'Pending').length;
        if (this.pendingTasks > 0 && !sessionStorage.getItem('pendingTasksToastShown')) {
          const Toast = Swal.mixin({
            toast: true,
            position: "top-end",
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            didOpen: (toast) => {
              toast.onmouseenter = Swal.stopTimer;
              toast.onmouseleave = Swal.resumeTimer;
            }
          });
          Toast.fire({
            icon: "warning",
            iconColor: '#ffffff',
            padding: '1rem 0.75rem',
            title: "You have " + this.pendingTasks + " pending tasks",
            background: '#ffaf1c',
            color: '#ffffff',
          });
          sessionStorage.setItem('pendingTasksToastShown', 'true');
        }
        this.updateTasksChart();
      },
      complete: () => {
        this.cdr.detectChanges();
      }
    }));
  }

  getAttendance() {
    this.subs.push(this.attendanceService.getAttendanceForEmployee().subscribe({
      next: (attendance) => {
        this.attendanceData = attendance;
        this.setTodayAttendanceStatus();
        this.calculateMonthlyAttendance();
        this.updateAttendanceChart();
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
    console.log("todayAttendance", this.todayAttendance);
  }

  private getCurrentTimeString(): string {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  }

  checkIn() {
    if (!this.employee) return;
    this.spinner.show();
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const attendance: any = {
          employeeId: this.employee.employeeId,
          checkInTime: this.getCurrentTimeString(),
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
        console.log("attendance", attendance);
        this.attendanceService.checkIn(attendance).subscribe({
          next: (resp) => {
            this.getAttendance();
            Swal.fire({
              title: "Success!",
              text: "You have checked in successfully.",
              icon: "success",
              timer: 1500,
              showConfirmButton: false,
            });
          },
          error: (err) => {
            console.log("Error", err.error.message);
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
          text: "Could not get your location. Please allow location access to check in.",
          icon: "error"
        });
      }
    );
  }

  checkOut() {
    if (!this.employee) return;
    this.spinner.show();
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const attendance: any = {
          employeeId: this.employee.employeeId,
          checkOutTime: this.getCurrentTimeString(),
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
        console.log("attendance", attendance);
        this.attendanceService.checkOut(attendance).subscribe({
          next: (resp) => {
            this.getAttendance();
            Swal.fire({
              title: "Success!",
              text: "You have checked out successfully.",
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
        console.log(error);
        Swal.fire({
          title: "Error!",
          text: "Could not get your location. Please allow location access to check out.",
          icon: "error"
        });
      }
    );
  }

  getPendingLeaves() {
    this.subs.push(this.requestHolidayService.getRequestHolidays().subscribe({
      next: (leaves) => {
        if (!this.employee?.fullName) {
          this.pendingLeaves = 0;
        } else {
          this.pendingLeaves = leaves.filter(l => l.employeeName === this.employee.fullName && l.status?.toLowerCase() === 'pending').length;
        }
      },
      complete: () => {
        this.cdr.detectChanges();
      }
    }));
  }

  getSalaryReport(){
    const now = new Date();
    let month = now.getMonth();
    let year = now.getFullYear();
    if (month === 0) {
      month = 12;
      year = year - 1;
    }
    this.subs.push(this.salaryReportService.getSalaryReportForSpecificEmployeeInMonth(this.employee.employeeId, month, year).subscribe({
      next: (report) => {
        this.salaryData = report;
        
      },
      error:(err)=>{
        console.log(err);  
      },
      complete: () => {
        this.updateSalaryChart();
        this.cdr.detectChanges();
      }
    }));
  }

  calculateMonthlyAttendance() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const days: string[] = [];
    for (let d = 1; d <= now.getDate(); d++) {
      const date = new Date(year, month, d);
      const dayOfWeek = date.getDay();
      if (dayOfWeek !== 5 && dayOfWeek !== 6) {
        days.push(date.toLocaleDateString('en-CA'));
      }
    }
    const attendedDays = days.filter(day =>
      this.attendanceData.some(a => a.attendanceDate && new Date(a.attendanceDate).toLocaleDateString('en-CA') === day)
    );
    this.totalAttendancesThisMonth = attendedDays.length;
    this.totalAbsencesThisMonth = days.length - attendedDays.length;
    this.cdr.detectChanges();
  }

  updateAttendanceChart() {
    if (!this.viewInitialized) return;
    const present = this.totalAttendancesThisMonth;
    const absent = this.totalAbsencesThisMonth;
    if (this.attendanceChart) this.attendanceChart.destroy();
    if (this.attendanceChartCanvas && this.attendanceChartCanvas.nativeElement) {
      const ctx = this.attendanceChartCanvas.nativeElement.getContext('2d');
      if (ctx) {
        const gradient1 = ctx.createLinearGradient(0, 0, 0, 400);
        gradient1.addColorStop(0, '#2196F3');
        gradient1.addColorStop(1, '#1976D2');
        
        const gradient2 = ctx.createLinearGradient(0, 0, 0, 400);
        gradient2.addColorStop(0, '#ef5350');
        gradient2.addColorStop(1, '#d32f2f');
        
        this.attendanceChart = new Chart(this.attendanceChartCanvas.nativeElement, {
          type: 'pie',
          data: {
            labels: ['Present', 'Absent'],
            datasets: [{
              data: [present, absent],
              backgroundColor: [gradient1, gradient2]
            }]
          },
          options: {
            plugins: {
              legend: { display: true, labels: { font: chartFont, color: chartFontColor } },
              tooltip: { bodyFont: chartFont, titleFont: chartFont }
            },
            responsive: true,
            maintainAspectRatio: false
          }
        });
      }
    }
    this.cdr.detectChanges();
  }

  updateSalaryChart() {
    if (!this.viewInitialized || !this.salaryData) return;
    if (this.salaryChart) this.salaryChart.destroy();
    if (this.salaryChartCanvas && this.salaryChartCanvas.nativeElement) {
      const ctx = this.salaryChartCanvas.nativeElement.getContext('2d');
      if (ctx) {
        const gradient1 = ctx.createLinearGradient(0, 0, 0, 400);
        gradient1.addColorStop(0, '#4CAF50');
        gradient1.addColorStop(1, '#45a049');
        
        const gradient2 = ctx.createLinearGradient(0, 0, 0, 400);
        gradient2.addColorStop(0, '#FF9800');
        gradient2.addColorStop(1, '#F57C00');
        
        const gradient3 = ctx.createLinearGradient(0, 0, 0, 400);
        gradient3.addColorStop(0, '#2196F3');
        gradient3.addColorStop(1, '#1976D2');
        
        this.salaryChart = new Chart(this.salaryChartCanvas.nativeElement, {
          type: 'pie',
          data: {
            labels: ['Net Salary', 'Deductions', 'Overtime'],
            datasets: [{
              data: [this.salaryData.netSalary, this.salaryData.deductionAmount, this.salaryData.overtimeAmount],
              backgroundColor: [gradient1, gradient2, gradient3]
            }]
          },
          options: {
            plugins: {
              legend: { display: true, labels: { font: chartFont, color: chartFontColor } },
              tooltip: { bodyFont: chartFont, titleFont: chartFont }
            },
            responsive: true,
            maintainAspectRatio: false
          }
        });
      }
    }
    this.cdr.detectChanges();
  }

  updateTasksChart() {
    if (!this.viewInitialized) return;
    if (this.tasksChart) this.tasksChart.destroy();
    // Count tasks by status
    const pending = this.employeeTasks.filter(t => t.status === 'Pending').length;
    const done = this.employeeTasks.filter(t => t.status === 'Done').length;
    const late = this.employeeTasks.filter(t => t.status === 'Late').length;
    if (this.tasksChartCanvas && this.tasksChartCanvas.nativeElement) {
      this.tasksChart = new Chart(this.tasksChartCanvas.nativeElement, {
        type: 'bar',
        data: {
          labels: ['Pending', 'Done', 'Late'],
          datasets: [{
            label: 'Tasks',
            data: [pending, done, late],
            backgroundColor: ['#f59e42', '#66bb6a', '#ef5350'],
            borderRadius: 8
          }]
        },
        options: {
          plugins: {
            legend: { display: false },
            tooltip: { bodyFont: chartFont, titleFont: chartFont }
          },
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              ticks: { font: chartFont, color: chartFontColor }
            },
            x: {
              ticks: { font: chartFont, color: chartFontColor }
            }
          }
        }
      });
    }
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    if (this.attendanceChart) this.attendanceChart.destroy();
    if (this.salaryChart) this.salaryChart.destroy();
    if (this.tasksChart) this.tasksChart.destroy();
  }
}
