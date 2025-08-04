import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ILoginData } from '../Interfaces/ilogin-data';
import { BehaviorSubject, Observable } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { Router } from '@angular/router';



@Injectable({
  providedIn: 'root'
})
export class AuthService {
  apiUrl = 'https://localhost:7124/api/auth';
  private isAuthenticated = false;
  userData = new BehaviorSubject<any>(null);
  userEmail = new BehaviorSubject<string | null>(null);
  userRole = new BehaviorSubject<string | null>(null);
  userName = new BehaviorSubject<string | null>(null);
  userId = new BehaviorSubject<number | null>(null);

  constructor(private http: HttpClient, private router: Router) {
    if (typeof window !== 'undefined' && localStorage) {
      if(localStorage.getItem('token')) {
        this.saveUserData();
      }
    }
  }

  login(loginData: any): Observable<any> {
    // Accept FormData or ILoginData
    return this.http.post<any>(`${this.apiUrl}/login`, loginData);
  }

  saveUserData() {
    let encodedToken = JSON.stringify(localStorage.getItem('token'));
    let decodedToken = jwtDecode(encodedToken);
    this.userData.next(decodedToken);
    this.userRole.next(localStorage.getItem('role'));
    this.userEmail.next(localStorage.getItem('email'));
    this.userName.next(localStorage.getItem('userName'));
    this.userId.next(Number(localStorage.getItem('userId')));
    this.isAuthenticated = true;
  }

  getToken() {
    if (typeof window !== 'undefined' && localStorage) {
      return localStorage.getItem('token');
    }
    return null;
  }

  getEmail() {
    return this.userEmail.getValue();
  }

  getRole() {
    return this.userRole.getValue();
  }

  getUserName() {
    return this.userName.getValue();
  }

  getUserId() {
    return this.userId.getValue();
  }

  logout() {
    if (typeof window !== 'undefined' && localStorage) {  
      localStorage.clear()
    }
    this.userData.next(null);
    sessionStorage.clear();
    this.isAuthenticated = false;
    this.router.navigate(['/login']);
  }

  authenticated() {
    if (typeof window !== 'undefined' && localStorage) {
      return !!localStorage.getItem('token');
    }
    return false;
  }
}
