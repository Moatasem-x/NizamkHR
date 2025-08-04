import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { IDepartment } from '../../Interfaces/idepartment';
import { IEmployee } from '../../Interfaces/iemployee';
import { DepartmentService } from '../../Services/department-service';
import { EmployeeService } from '../../Services/employee-service';
import { AuthService } from '../../Services/auth-service';
import { ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HRService } from '../../Services/hr-service';
import Swal from 'sweetalert2';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { Router } from '@angular/router';

@Component({
  selector: 'app-hr-form',
  imports: [ReactiveFormsModule, CommonModule, NgxSpinnerModule],
  templateUrl: './hr-form.html',
  styleUrl: './hr-form.css'
})
export class HRForm implements OnInit, OnDestroy {
  hrForm!: FormGroup;
  textType = false;
  selectedImageName = '';
  imagePreviewUrl: string | ArrayBuffer | null = null;

  genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
  ];

  departmentOptions: IDepartment[] = [];
  subs: Subscription[] = [];
  hrDepartmentId: number | null = null;

  constructor(
    private fb: FormBuilder, 
    private HRService: HRService,
    private departmentService: DepartmentService, 
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    private spinner: NgxSpinnerService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.spinner.show();
    this.loadDepartments();
    this.initForm();
    
  }

  initForm(): void {
    this.hrForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      address: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(25)]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^\+20[0125][0-9]{9}$/)]],
      gender: ['', Validators.required],
      nationalId: ['', [Validators.required, Validators.pattern(/^\d{14}$/)]],
      departmentId: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z]).{8,}$/)
        ]
      ],
      hireDate: ['', Validators.required],
      salary: ['', [Validators.required, Validators.min(0)]],
      workStartTime: ['', Validators.required],
      workEndTime: ['', Validators.required],
      image: [null, Validators.required]
    }, { validators: this.timeValidation });
  }

  timeValidation(group: FormGroup): {[key: string]: any} | null {
    const startTime = group.get('workStartTime')?.value;
    const endTime = group.get('workEndTime')?.value;
    
    if (startTime && endTime) {
      const start = new Date(`2000-01-01T${startTime}`);
      const end = new Date(`2000-01-01T${endTime}`);
      
      if (end <= start) {
        return { 'invalidTimeRange': true };
      }
    }
    return null;
  }

  loadDepartments(): void {
    const sub = this.departmentService.getDepartments().subscribe({
      next: (resp) => {
        this.departmentOptions = resp;
        // Automatically select HR department if it exists
        const hrDepartment = this.departmentOptions.find(dept => dept.departmentName === 'HR');
        if (hrDepartment) {
          this.hrDepartmentId = hrDepartment.departmentId;
          this.hrForm.get('departmentId')?.setValue(hrDepartment.departmentId);
          this.hrForm.get('departmentId')?.disable(); // Make it readonly
        }
      },
      error: (err) => {
        this.spinner.hide();
      },
      complete: () => {
        this.spinner.hide();
      }
    });
    this.subs.push(sub);
  }

  onSubmit(): void {
    if (this.hrForm.valid) {
      // Re-enable department field if it was disabled
      if (this.hrDepartmentId) {
        this.hrForm.get('departmentId')?.enable();
      }
      
      const formValue = this.hrForm.value;
      const hrData: IEmployee = { ...formValue };
      this.spinner.show();
      const formData = new FormData();

      // Append all fields except image
      Object.keys(hrData).forEach(key => {
        if (key !== 'image' && hrData[key as keyof IEmployee] !== undefined && hrData[key as keyof IEmployee] !== null) {
          formData.append(key, hrData[key as keyof IEmployee] as any);
        }
      });

      // Append the image file if present
      if (hrData.image) {
        formData.append('image', hrData.image);
      }
      console.log(formData);

      const sub = this.HRService.addHR(formData).subscribe({
        next: (resp) => {
          Swal.fire({
            title: "Success!",
            text: "HR Has Been Added Successfully.",
            icon: "success",
            timer: 1500,
            showConfirmButton: false
          });
          this.router.navigate(['/employees']);
        },
        error: (err) => {
          this.spinner.hide();
          this.hrForm.get('departmentId')?.disable();
          if (err.error.message == "DuplicateEmail") {
              Swal.fire({
                title: "Error!",
                text: "Email already exists.",
                icon: "error"
              });
            } 
            else  if (err.error.message == "Duplicate phone number") {
              Swal.fire({
                title: "Error!",
                text: "Phone number already exists.",
                icon: "error"
              });
            }
            else if (err.error.message == "Duplicate National ID") {
              Swal.fire({
                title: "Error!",
                text: "National ID already exists.",
                icon: "error"
              });
            }
          else {
            Swal.fire({
              title: "Error!",
              text: "Failed to add HR. Please try again.",
              icon: "error"
            });
          }
        },
        complete: () => {
          this.resetForm();
          this.spinner.hide();
        }
      });
      this.subs.push(sub);
    }
    else {
      this.markFormGroupTouched();
    }
  }

  markFormGroupTouched(): void {
    Object.keys(this.hrForm.controls).forEach(key => {
      const control = this.hrForm.get(key);
      control?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string {
    const field = this.hrForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return `${this.getFieldLabel(fieldName)} is required`;
      }
      if (field.errors['minlength']) {
        return `${this.getFieldLabel(fieldName)} must be at least ${field.errors['minlength'].requiredLength} characters`;
      }
      if (field.errors['maxlength']) {
        return `${this.getFieldLabel(fieldName)} must not exceed ${field.errors['maxlength'].requiredLength} characters`;
      }
      if (field.errors['pattern']) {
        return this.getPatternErrorMessage(fieldName);
      }
      if (fieldName === 'email' && field.errors['email']) {
        return this.getPatternErrorMessage(fieldName);
      }
      if (field.errors['min']) {
        return `${this.getFieldLabel(fieldName)} must be greater than 0`;
      }
    }
    return '';
  }

  getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      name: 'HR Name',
      address: 'Address',
      phoneNumber: 'Phone Number',
      gender: 'Gender',
      idNumber: 'ID Number',
      joinDate: 'Join Date',
      salary: 'Salary',
      departmentId: 'Department',
      email: 'Email',
      password: 'Password',
      workStartTime: 'Work Start Time',
      workEndTime: 'Work End Time',
    };
    return labels[fieldName] || fieldName;
  }

  getPatternErrorMessage(fieldName: string): string {
    const messages: { [key: string]: string } = {
      phoneNumber: 'Please enter a valid phone number starting with +20, followed by 0, 1, 2, or 5, then 9 digits.',
      nationalId: 'ID Number must be exactly 14 digits',
      email: 'Please enter a valid email address',
      password: 'Password must be at least 8 characters and contain both uppercase and lowercase letters.',
    };
    return messages[fieldName] || 'Invalid format';
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.hrForm.get(fieldName);
    return !!(field?.invalid && field?.touched);
  }

  onImageChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.hrForm.get('image')?.setValue(file);
      this.selectedImageName = file.name;
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreviewUrl = (e.target?.result ?? null) as string | ArrayBuffer | null;
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    } else {
      this.imagePreviewUrl = null;
      this.selectedImageName = '';
      this.hrForm.get('image')?.setValue(null);
    }
  }

  resetForm(): void {
    this.hrForm.reset();
    // Reset all fields except department
    this.hrForm.patchValue({
      gender: '',
      // Keep HR department selected
      departmentId: this.hrDepartmentId || '',
    });
    // Keep department field disabled for HR
    if (this.hrDepartmentId) {
      this.hrForm.get('departmentId')?.disable();
    }
    this.imagePreviewUrl = null;
    this.selectedImageName = '';
  }

  toggleTextType(): void {
    this.textType = !this.textType;
  }

  ngOnDestroy(): void {
    this.subs.forEach(sub => sub.unsubscribe());
  }
}
