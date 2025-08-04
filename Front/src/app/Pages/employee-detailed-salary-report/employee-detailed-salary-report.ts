import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { Subscription } from 'rxjs';
import { IDetailedSalaryReport } from '../../Interfaces/idetailed-salary-report';
import { SalaryReportService } from '../../Services/salary-report-service';

@Component({
  selector: 'app-employee-detailed-salary-report',
  standalone: true,
  imports: [CommonModule, NgxSpinnerModule],
  templateUrl: './employee-detailed-salary-report.html',
  styleUrl: './employee-detailed-salary-report.css'
})
export class EmployeeDetailedSalaryReport implements OnInit, OnDestroy {
  detailedReport: IDetailedSalaryReport | null = null;
  subs: Subscription[] = [];
  
  // Query parameters
  employeeId: number = 0;
  month: number = 0;
  year: number = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private salaryReportService: SalaryReportService,
    private spinner: NgxSpinnerService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.spinner.show();
    this.route.queryParams.subscribe(params => {
      this.employeeId = +params['employeeId'] || 0;
      this.month = +params['month'] || 0;
      this.year = +params['year'] || 0;
      
      if (this.employeeId && this.month && this.year) {
        this.loadDetailedReport();
      } else {
        console.error('Missing required parameters');
        this.spinner.hide();
        this.router.navigate(['/salaryreports']);
      }
    });
  }

  ngOnDestroy(): void {
    this.subs.forEach(sub => sub.unsubscribe());
  }

  loadDetailedReport(): void {
    this.subs.push(this.salaryReportService.getDetailedSalaryReport(this.employeeId, this.month, this.year).subscribe({
      next: (report) => {
        console.log('Detailed salary report loaded:', report);
        this.detailedReport = report;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading detailed salary report:', err);
        this.spinner.hide();
      },
      complete: () => {
        this.spinner.hide();
        this.cdr.detectChanges();
      }
    }));
  }

  getMonthName(month: number): string {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1] || 'Unknown';
  }

  formatTime(time: string): string {
    if (!time) return 'N/A';
    // If time is already in HH:MM:SS format, return it directly
    if (time.includes(':') && time.length === 8) {
      return time;
    }
    // If it's a date string, extract the time part
    try {
      const date = new Date(time);
      if (isNaN(date.getTime())) {
        return time; // Return original if it's not a valid date
      }
      return date.toTimeString().substring(0, 8); // Get HH:MM:SS format
    } catch {
      return time; // Return original if parsing fails
    }
  }

  formatDate(date: string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatCurrency(amount: number): string {
    if (amount === null || amount === undefined) return 'LE 0.00';
    return `EGP ${amount.toFixed(2)}`;
  }

  goBack(): void {
    this.router.navigate(['/salaryreports']);
  }
}
