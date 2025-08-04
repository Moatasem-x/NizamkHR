import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IEmployee } from '../Interfaces/iemployee';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  constructor(private http: HttpClient) { }
  private apiUrl = 'https://localhost:7124/api/employee';

  getEmployees(): Observable<IEmployee[]> {
    return this.http.get<IEmployee[]>(this.apiUrl);
  }

  getEmployeeById(id: number): Observable<IEmployee> {
    return this.http.get<IEmployee>(`${this.apiUrl}/${id}`);
  }

  getCurrentEmployee(): Observable<IEmployee> {
    return this.http.get<IEmployee>(`${this.apiUrl}/my-profile`);
  }

  addEmployee(employee: FormData): Observable<any> {
    return this.http.post(this.apiUrl, employee);
  }

  deleteEmployee(id: number): Observable<IEmployee> {
    return this.http.delete<IEmployee>(`${this.apiUrl}/${id}`);
  }

  editEmployee(Emp: FormData, id: number): Observable<IEmployee> {
    console.log("employee: ", Emp);
    return this.http.put<IEmployee>(`${this.apiUrl}/${id}`, Emp);
  }

  editCurrentEmployeeProfile(employee: IEmployee): Observable<IEmployee> {
    return this.http.put<IEmployee>(`${this.apiUrl}/update-profile`, employee);
  }
}
