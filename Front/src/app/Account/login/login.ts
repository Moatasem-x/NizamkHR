import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../Services/auth-service';
import { ILoginData } from '../../Interfaces/ilogin-data';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { WebcamImage, WebcamModule } from 'ngx-webcam';
import { Subject } from 'rxjs';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, WebcamModule,NgxSpinnerModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login implements OnInit, OnDestroy {
  loginForm!: FormGroup;
  error: string | null = null;
  subs: Subscription[] = [];
  showWebcam = false;
  capturedImage: WebcamImage | null = null;
  private trigger: Subject<void> = new Subject<void>();

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router, private cdr: ChangeDetectorRef,private spinner:NgxSpinnerService) {
    
  }

  ngOnInit() {
    if (typeof window !== 'undefined' && localStorage) {
      if (localStorage.getItem('token')) {
        this.router.navigate(['/employees']);
      }
    }
    this.initForm();
  }

  initForm() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }

  onSubmit() {
    this.error = null;
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    // Show webcam modal instead of logging in immediately
    this.showWebcam = true;
  }

  triggerSnapshot(): void {
    this.trigger.next();
  }

  handleImage(webcamImage: WebcamImage): void {
    this.capturedImage = webcamImage;
  }

  get triggerObservable() {
    return this.trigger.asObservable();
  }

  submitWithImage() {
    if (!this.capturedImage) return;
    this.spinner.show();
    
    const formData = new FormData();
    formData.append('email', this.loginForm.value.email);
    formData.append('password', this.loginForm.value.password);
    // Convert base64 to Blob
    const blob = this.dataURLtoBlob(this.capturedImage.imageAsDataUrl);
    formData.append('image', blob, 'image.jpg');
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
    this.subs.push(this.authService.login(formData).subscribe({
      next: (resp) => {
        if (resp && resp.token) {
          if (typeof window !== 'undefined' && localStorage) {
            localStorage.setItem('token', resp.token);
            localStorage.setItem('role', resp.role);
            localStorage.setItem('email', resp.email);
            localStorage.setItem('userName', resp.fullName);
            localStorage.setItem('userId', resp.employeeId);
          }
          this.authService.saveUserData();
          this.authService.userEmail.next(resp.email);
          this.authService.userRole.next(resp.role);
          this.authService.userName.next(resp.fullName);
          this.authService.userId.next(resp.employeeId);
          
          this.cdr.detectChanges();
          if (resp.role === "Employee") {
            this.router.navigate(['/empdash']);
          } else {
            setTimeout(() => {
              Toast.fire({
                icon: "success",
                iconColor: '#ffffff',
                padding: '1rem 0.75rem',
                title: "Signed in successfully",
                background: "#198754",
                color: '#ffffff',
                });
              this.router.navigate(['/hrdash']);
            }, 5000);
          }
        } else {
          this.error = 'Invalid response from server.';
        }
        this.showWebcam = false;
        this.capturedImage = null;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Login failed. Please try again.';
        this.spinner.hide();
        this.showWebcam = false;
        this.capturedImage = null;
          Toast.fire({
            icon: "error",
            title: "Invalid credentials. Try again please.",
            iconColor: "#fff",
            background: "#dc3545",
            color:"#fff",
            padding: '1rem 0.75rem',
            });
      },
      complete: () => {
        setTimeout(() => {
          this.spinner.hide();
        }, 5000);
      }
    }));
  }

  dataURLtoBlob(dataurl: string) {
    const arr = dataurl.split(','),
      match = arr[0].match(/:(.*?);/),
      mime = match ? match[1] : 'image/jpeg',
      bstr = atob(arr[1]),
      n = bstr.length,
      u8arr = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      u8arr[i] = bstr.charCodeAt(i);
    }
    return new Blob([u8arr], { type: mime });
  }

  ngOnDestroy(): void {
    this.subs.forEach(sub => sub.unsubscribe());
  }
}
