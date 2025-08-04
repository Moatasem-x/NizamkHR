import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ISalaryReport } from '../Interfaces/isalary-report';
import { IDetailedSalaryReport } from '../Interfaces/idetailed-salary-report';

@Injectable({
  providedIn: 'root'
})
export class SalaryReportService {
  private apiUrl = 'https://localhost:7124/api/SalaryReports';

  constructor(private http: HttpClient) {}

  getSalaryReports(): Observable<ISalaryReport[]> {
    return this.http.get<ISalaryReport[]>(`${this.apiUrl}/all`);
  }

  getSalaryReportForSpecificEmployeeInMonth(id:number , m:number,y:number ): Observable<ISalaryReport> {
    return this.http.post<ISalaryReport>(`${this.apiUrl}/SpecificSalary`, {employeeId: id, month: m, year: y});
  }

  getSalaryReportsByMonthYear(month: number, year: number): Observable<ISalaryReport[]> {
    return this.http.get<ISalaryReport[]>(`${this.apiUrl}/byMonthYear?month=${month}&year=${year}`);
  }

  getDetailedSalaryReport(id: number, month: number, year: number): Observable<IDetailedSalaryReport> {
    return this.http.post<IDetailedSalaryReport>(`${this.apiUrl}/detailedsalary`, {employeeId: id, month: month, year: year});
  }
  
}
