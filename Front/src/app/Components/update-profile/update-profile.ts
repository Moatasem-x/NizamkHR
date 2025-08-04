import { Component, OnInit, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { EmployeeService } from '../../Services/employee-service';
import { AuthService } from '../../Services/auth-service';
import Swal from 'sweetalert2';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-update-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './update-profile.html',
  styleUrl: './update-profile.css',
  animations: [
    trigger('modalAnim', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.9)' }),
        animate('220ms cubic-bezier(0.4,0,0.2,1)', style({ opacity: 1, transform: 'scale(1)' }))
      ]),
      transition(':leave', [
        animate('180ms cubic-bezier(0.4,0,0.2,1)', style({ opacity: 0, transform: 'scale(0.9)' }))
      ])
    ])
  ]
})
export class UpdateProfile implements OnInit {
  @Output() close = new EventEmitter<void>();
  profileForm!: FormGroup;
  employee: any;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private employeeService: EmployeeService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.isLoading = true;
    this.employeeService.getCurrentEmployee().subscribe({
      next: (employee) => {
        this.employee = employee;
        this.initProfileForm();
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  initProfileForm() {
    this.profileForm = this.fb.group({
      address: [this.employee?.address || '', [Validators.required, Validators.minLength(4), Validators.maxLength(25)]],
      phoneNumber: [this.employee?.phoneNumber || '', [Validators.required, Validators.pattern(/^\+20[0125][0-9]{9}$/)]]
    });
  }

  saveProfileEdit() {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }
    Swal.fire({
      title: 'Are you sure?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes'
    }).then((result) => {
      if (result.isConfirmed) {
        this.employeeService.editCurrentEmployeeProfile(this.profileForm.value).subscribe({
          next: (resp) => {
            Swal.fire({
              title: 'Success!',
              text: 'Profile Has Been Updated Successfully.',
              icon: 'success'
            });
            this.employee = { ...this.employee, ...this.profileForm.value };
            this.close.emit();
          },
          error: (err) => {
            if (err.error.message == 'Duplicate phone number') {
              Swal.fire({
                title: 'Error!',
                text: 'Phone number already exists.',
                icon: 'error'
              });
            } else {
              Swal.fire({
                title: 'Error!',
                text: 'Failed to update profile.',
                icon: 'error'
              });
            }
          }
        });
      }
    });
  }
} 