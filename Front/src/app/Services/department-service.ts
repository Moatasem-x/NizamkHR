import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IDepartment } from '../Interfaces/idepartment';

@Injectable({
  providedIn: 'root'
})
export class DepartmentService {

  constructor(private http: HttpClient) { }
  private apiUrl = 'https://localhost:7124/api/department';

  getDepartments(): Observable<IDepartment[]> {
    return this.http.get<IDepartment[]>(this.apiUrl);
  }

  addDepartment(department: IDepartment): Observable<IDepartment> {
    return this.http.post<IDepartment>(this.apiUrl, department);
  }

  editDepartment(department: IDepartment): Observable<IDepartment> {
    return this.http.put<IDepartment>(this.apiUrl, department);
  }

  deleteDepartment(departmentId: number): Observable<IDepartment> {
    return this.http.delete<IDepartment>(`${this.apiUrl}/${departmentId}`);
  }
}
