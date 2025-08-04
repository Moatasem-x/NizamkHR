import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { Subscription } from 'rxjs';
import { IEmployee } from '../../Interfaces/iemployee';
import { ISalaryReport } from '../../Interfaces/isalary-report';
import { EmployeeService } from '../../Services/employee-service';
import { SalaryReportService } from '../../Services/salary-report-service';
import * as jsPDF from 'jspdf';
import html2canvas from 'html2canvas';


@Component({
  selector: 'app-employee-info-report',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxSpinnerModule],
  templateUrl: './employee-info-report.html',
  styleUrls: ['./employee-info-report.css']
})
export class EmployeeInfoReport implements OnInit, OnDestroy {
  employeeId: number = 0;
  employee: IEmployee | null = null;
  salaryReport: ISalaryReport | null = null;
  subs: Subscription[] = [];
  
  // Month and year from query parameters
  selectedMonth: number = 0;
  selectedYear: number = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private employeeService: EmployeeService,
    private salaryReportService: SalaryReportService,
    private spinner: NgxSpinnerService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.spinner.show();
    this.route.params.subscribe(params => {
      this.employeeId = +params['id'];
      if (this.employeeId) {
        // Get query parameters for month and year
        this.route.queryParams.subscribe(queryParams => {
          this.selectedMonth = +queryParams['month'] || 0;
          this.selectedYear = +queryParams['year'] || 0;
          
          if (this.selectedMonth && this.selectedYear) {
            this.loadEmployeeData();
          } else {
            console.error('Month and year query parameters are required');
            this.spinner.hide();
            // Optionally redirect back or show error
            this.router.navigate(['/salaryreports']);
          }
        });
      }
    });
  }

  ngOnDestroy(): void {
    this.subs.forEach(sub => sub.unsubscribe());
  }

  loadEmployeeData(): void {
    // Load employee information
    this.subs.push(this.employeeService.getEmployeeById(this.employeeId).subscribe({
      next: (employee) => {
        console.log('Employee loaded:', employee);
        this.employee = employee;
        this.loadSalaryReport();
      },
      error: (err) => {
        console.error('Error loading employee:', err);
        this.spinner.hide();
      }
    }));
  }

  loadSalaryReport(): void {
    if (!this.selectedMonth || !this.selectedYear) {
      console.error('Month and year must be provided');
      this.spinner.hide();
      return;
    }

    this.subs.push(this.salaryReportService.getSalaryReportForSpecificEmployeeInMonth(this.employeeId, this.selectedMonth, this.selectedYear).subscribe({
      next: (report) => {
        console.log('Salary report loaded:', report);
        this.salaryReport = report;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading salary report:', err);
        // Create a default salary report if none exists
        this.createDefaultSalaryReport();
      },
      complete: () => {
        this.spinner.hide();
        this.cdr.detectChanges();
      }
    }));
  }

  createDefaultSalaryReport(): void {
    if (this.employee) {
      this.salaryReport = {
        employeeId: this.employee.employeeId,
        employeeName: this.employee.fullName,
        departmentName: this.employee.departmentName,
        month: this.selectedMonth,
        year: this.selectedYear,
        basicSalary: this.employee.salary,
        overtimeAmount: 0,
        deductionAmount: 0,
        netSalary: this.employee.salary
      };
    }
    this.spinner.hide();
  }

  getMonthName(month: number): string {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1] || 'Unknown';
  }

  goBack(): void {
    this.router.navigate(['/salaryreports']);
  }

  exportPDF() {
    const data = document.getElementById('section-to-export');
    html2canvas(data!, {
      scale: 2, // Higher resolution for clarity
      useCORS: true
    }).then(canvas => {
      const imgWidth = 210; // A4 portrait width in mm
      const pageHeight = 250; // A4 portrait height in mm
      const imgHeight = canvas.height * imgWidth / canvas.width;
      const contentDataURL = canvas.toDataURL('image/png');
      const pdf = new jsPDF.jsPDF('p', 'mm', 'a4'); // 'p' for portrait
      let position = 0;
      let heightLeft = imgHeight;

      // Multi-page support
      while (heightLeft > 0) {
        pdf.addImage(contentDataURL, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        if (heightLeft > 0) {
          pdf.addPage();
          position -= pageHeight;
        }
      }
      pdf.save('exported-file.pdf');
      this.cdr.detectChanges();
    });
  }

  goToDetailedReport() {
    this.router.navigate(['/detailedreport'], {
      queryParams: {
        employeeId: this.employeeId,
        month: this.selectedMonth,
        year: this.selectedYear
      }
    });
  }
} 