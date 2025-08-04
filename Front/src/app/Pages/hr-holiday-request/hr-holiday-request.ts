import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { RequestHolidayService } from '../../Services/request-holiday-service';
import { IHolidayType } from '../../Interfaces/iholiday-type';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-hr-holiday-request',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgxSpinnerModule],
  templateUrl: './hr-holiday-request.html',
  styleUrls: ['./hr-holiday-request.css']
})
export class HRHolidayRequest implements OnInit {
  holidayTypes: IHolidayType[] = [];
  holidayTypeForm!: FormGroup;
  error: string = '';
  success: string = '';

  constructor(
    private requestHolidayService: RequestHolidayService,
    private spinner: NgxSpinnerService,
    private router: Router,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadHolidayTypes();
  }

  initForm(): void {
    this.holidayTypeForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      maxDaysPerYear: [0, [Validators.required, Validators.min(1), Validators.max(365)]]
    });
  }

  loadHolidayTypes(): void {
    this.spinner.show();
    this.requestHolidayService.getHolidayTypes().subscribe({
      next: (types) => {
        this.holidayTypes = types;
        this.spinner.hide();
        this.cdr.detectChanges(); // Ensure the view updates with the new data
      },
      error: (error) => {
        console.error('Error loading holiday types:', error);
        this.error = 'Failed to load holiday types';
        this.spinner.hide();
        this.cdr.detectChanges(); // Ensure the view updates with the new data

      }
    });
  }

  onSubmit(): void {
    if (this.holidayTypeForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    const newHolidayType: IHolidayType = {
    
      name: this.holidayTypeForm.value.name,
      maxDaysPerYear: this.holidayTypeForm.value.maxDaysPerYear
    };

    this.spinner.show();
    this.requestHolidayService.addHolidayType(newHolidayType).subscribe({
      next: (response) => {
        this.success = 'Holiday type added successfully!';
        this.resetForm();
        this.loadHolidayTypes(); // Reload the list
        this.spinner.hide();
        this.cdr.detectChanges(); // Ensure the view updates with the new data
        setTimeout(() => {
          this.success = '';
        }, 3000);
      },
      error: (error) => {
        console.error('Error adding holiday type:', error);
        this.error = 'Failed to add holiday type';
        this.spinner.hide();
        this.cdr.detectChanges(); // Ensure the view updates with the new data
        setTimeout(() => {
          this.error = '';
        }, 3000);
      }
    });
  }

  markFormGroupTouched(): void {
    Object.keys(this.holidayTypeForm.controls).forEach(key => {
      const control = this.holidayTypeForm.get(key);
      control?.markAsTouched();
    });
  }

  resetForm(): void {
    this.holidayTypeForm.reset();
    this.holidayTypeForm.patchValue({
      name: '',
      maxDaysPerYear: 0
    });
    this.error = '';
  }

  deleteHolidayType(id: number): void {
      Swal.fire({
        title: "Are you sure?",
        text: "You won't be able to revert this!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes"
      }).then((result) => {
        if (result.isConfirmed) {
  this.requestHolidayService.deleteHolidayType(id).subscribe({
    next: () => {
      this.success = 'Holiday type deleted successfully!';
      this.loadHolidayTypes(); // Reload the list
      this.spinner.hide();
      this.cdr.detectChanges(); // Ensure the view updates with the new data
        Swal.fire({
          title: "Deleted!",
          text: "Holiday has been deleted.",
          icon: "success"
        });
      
    },
    error: (error) => {
      console.error('Error deleting holiday type:', error);
      this.error = 'Failed to delete holiday type';
      this.spinner.hide();
        this.cdr.detectChanges(); // Ensure the view updates with the new data
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Something went wrong!",
      });
    }
  });

  }
});
} 
}