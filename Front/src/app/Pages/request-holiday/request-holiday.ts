import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RequestHolidayService } from '../../Services/request-holiday-service';
import { AuthService } from '../../Services/auth-service';
import { IHolidayType } from '../../Interfaces/iholiday-type';
import { IRequestHoliday } from '../../Interfaces/irequest-holiday';
import Swal from 'sweetalert2';
import { Subscription } from 'rxjs';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-request-holiday',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, NgxSpinnerModule],
  templateUrl: './request-holiday.html',
  styleUrl: './request-holiday.css'
})
export class RequestHoliday implements OnInit {
  holidayForm!: FormGroup;
  holidayTypes: IHolidayType[] = [];
  submitError = '';
  subs: Subscription[] = [];

  constructor(
    private fb: FormBuilder,
    private requestHolidayService: RequestHolidayService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private spinner: NgxSpinnerService
  ) {}

  ngOnInit(): void {
    this.spinner.show();
    this.initForm();
    this.fetchHolidayTypes();
  }

  initForm(): void {
    this.holidayForm = this.fb.group({
      leaveTypeId: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      reason: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(300)]]
    });
  }

  fetchHolidayTypes(): void {
    const sub = this.requestHolidayService.getHolidayTypes().subscribe({
      next: (types) => {
        this.holidayTypes = types;
      },
      error: () => {
        this.holidayTypes = []
      },
      complete: () => {
        this.spinner.hide();
        this.cdr.detectChanges();
      }
    });
    this.subs.push(sub);
  }

  onSubmit(): void {
    this.submitError = '';
    if (this.holidayForm.invalid) {
      this.holidayForm.markAllAsTouched();
      return;
    }
    this.spinner.show();
    const employeeId = this.authService.getUserId();
    const formValue = this.holidayForm.value;
    const request: IRequestHoliday = {
      employeeId: employeeId ?? undefined,
      leaveTypeId: formValue.leaveTypeId,
      startDate: formValue.startDate,
      endDate: formValue.endDate,
      reason: formValue.reason
    };
    const sub = this.requestHolidayService.addHolidayRequest(request).subscribe({
      next: () => {
        Swal.fire({
          title: "Success!",
          text: "Request Sent Successfully.",
          icon: "success",
          timer: 1500,
          showConfirmButton: false
        });
        this.holidayForm.reset();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.spinner.hide();
        if (err.error.message == "You cannot request leave for a past date.") {
          Swal.fire({
            title: "Error!",
            text: "You cannot request leave for a past date.",
            icon: "error"
          });
        }
        else if (err.error.message == "Insufficient annual leave balance") {
          Swal.fire({
            title: "Error!",
            text: "Insufficient annual leave balance",
            icon: "error"
          });
        }
        else if (err.error.message == "Insufficient sick leave balance") {
          Swal.fire({
            title: "Error!",
            text: "Insufficient sick leave balance",
            icon: "error"
          });
        }
        else if (err.error.message == "You have pending leave request"){
          Swal.fire({
            title: "Error!",
            text: "You have pending leave request",
            icon: "error"
          });
        }
        else if (err.error.message == "You have took all allowed days of this leave this year"){
          Swal.fire({
            title: "Error!",
            text: "You have exceeded your limit",
            icon: "error"
          });
        }

        else if (err.error.message.includes("You can only take")){
          Swal.fire({
            title: "Error!",
            text: err.error.message,
            icon: "error"
          });
        }
        else {
          Swal.fire({
            title: "Error!",
            text: "Failed to submit request. Please try again.",
            icon: "error"
          });
        }
      },
      complete: () => {
        this.spinner.hide();
      }
    });
    this.subs.push(sub);
  }

  getFieldError(field: string): string {
    const control = this.holidayForm.get(field);
    if (control?.touched && control?.invalid) {
      if (control.errors?.['required']) return 'This field is required.';
      if (control.errors?.['minlength']) return `Minimum ${control.errors['minlength'].requiredLength} characters required.`;
      if (control.errors?.['maxlength']) return `Maximum ${control.errors['maxlength'].requiredLength} characters allowed.`;
    }
    return '';
  }
}
