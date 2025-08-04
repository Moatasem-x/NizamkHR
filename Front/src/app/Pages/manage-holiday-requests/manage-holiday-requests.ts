import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { RequestHolidayService } from '../../Services/request-holiday-service';
import { IRequestHoliday } from '../../Interfaces/irequest-holiday';
import { CommonModule } from '@angular/common';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-manage-holiday-requests',
  standalone: true,
  imports: [CommonModule, NgxSpinnerModule],
  templateUrl: './manage-holiday-requests.html',
  styleUrl: './manage-holiday-requests.css'
})
export class ManageHolidayRequests implements OnInit, OnDestroy {
  requests: IRequestHoliday[] = [];
  filteredRequests: IRequestHoliday[] = [];
  subs: Subscription[] = [];
  filter: string = 'all';
  filterName: string = '';
  filterDate: string = '';
  error = '';

  constructor(private requestHolidayService: RequestHolidayService, private cdr: ChangeDetectorRef, private spinner: NgxSpinnerService) {}

  ngOnInit(): void {
    this.spinner.show();
    this.fetchRequests();
  }

  fetchRequests(): void {
    this.subs.push(this.requestHolidayService.getRequestHolidays().subscribe({
      next: (data) => {
        this.requests = data;
        this.applyFilter();
        this.cdr.detectChanges();
      },
      error: () => {
        this.spinner.hide();
      }
    }));
  }

  applyFilter(): void {
    let filtered = this.requests;
    if (this.filter !== 'all') {
      filtered = filtered.filter(r => r.status?.toLowerCase() === this.filter);
    }
    if (this.filterName.trim()) {
      const name = this.filterName.trim().toLowerCase();
      filtered = filtered.filter(r => (r.employeeName || '').toLowerCase().includes(name));
    }
    if (this.filterDate) {
      filtered = filtered.filter(r => r.requestedAt && r.requestedAt.startsWith(this.filterDate));
    }
    this.filteredRequests = filtered;
    this.cdr.detectChanges();
    this.spinner.hide();
  }

  setFilter(status: string): void {
    this.filter = status;
    this.applyFilter();
  }

  setNameFilter(name: string): void {
    this.filterName = name;
    this.applyFilter();
  }

  setDateFilter(date: string): void {
    this.filterDate = date;
    this.applyFilter();
  }

  clearFilters(): void {
    this.filter = 'all';
    this.filterName = '';
    this.filterDate = '';
    this.applyFilter();
  }

  getBadgeClass(status: string | undefined): string {
    switch ((status || '').toLowerCase()) {
      case 'approved': return 'badge-approved';
      case 'pending': return 'badge-pending';
      case 'rejected': return 'badge-rejected';
      default: return 'badge-default';
    }
  }

  takeAction(request: IRequestHoliday, action: string): void {
    if (!request.id) {
      Swal.fire({
        title: 'Error!',
        text: 'An Error Occured. Please try again.',
        icon: 'error'
      });
      return;
    }
    Swal.fire({
      title: 'Are you sure?',
      text: 'You want to ' + action + ' this request.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes',
    }).then((result) => {
      if (result.isConfirmed) {
        this.subs.push(this.requestHolidayService.takeActionOnRequest(request.id || 0, action).subscribe({
          next: (updated) => {
            let idx = this.requests.findIndex(r => r.id === request.id);
            this.requests[idx].status = updated.status;
            this.applyFilter();
            this.cdr.detectChanges();
          },
          error: (err) => {
            this.error = 'Failed to update request.';
          },
          complete: () => {
          }
        }));
      }
    });
  }

  ngOnDestroy(): void {
    this.subs.forEach(sub => sub.unsubscribe());
  }
}
