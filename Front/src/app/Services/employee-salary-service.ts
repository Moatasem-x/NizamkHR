import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { IEmployeeSalary, IEmployeeSalaryFilter } from '../Interfaces/iemployee-salary';

@Injectable({
  providedIn: 'root'
})
export class EmployeeSalaryService {
  private employeeSalaries: IEmployeeSalary[] = [
    {
      employeeId: 1,
      employeeName: 'Mohamed Ahmed Ismail',
      department: 'Development',
      basicSalary: 5000,
      attendanceDays: 22,
      absenceDays: 0,
      overtimeHours: 0,
      deductionHours: 0,
      totalOvertime: 0,
      totalDeduction: 0,
      netSalary: 5000
    },
    {
      employeeId: 2,
      employeeName: 'Fatima Ali Mohamed',
      department: 'Human Resources',
      basicSalary: 4500,
      attendanceDays: 20,
      absenceDays: 2,
      overtimeHours: 8,
      deductionHours: 0,
      totalOvertime: 400,
      totalDeduction: 0,
      netSalary: 4900
    },
    {
      employeeId: 3,
      employeeName: 'Ahmed Mahmoud Hassan',
      department: 'Accounting',
      basicSalary: 6000,
      attendanceDays: 21,
      absenceDays: 1,
      overtimeHours: 12,
      deductionHours: 2,
      totalOvertime: 600,
      totalDeduction: 100,
      netSalary: 6500
    }
  ];

  constructor() { }

  getEmployeeSalaries(filter?: IEmployeeSalaryFilter): Observable<IEmployeeSalary[]> {
    let filteredData = [...this.employeeSalaries];
    
    if (filter) {
      if (filter.employeeName) {
        filteredData = filteredData.filter(emp => 
          emp.employeeName.toLowerCase().includes(filter.employeeName.toLowerCase())
        );
      }
    }
    
    return of(filteredData);
  }

  addEmployeeSalary(salary: IEmployeeSalary): Observable<IEmployeeSalary> {
    this.employeeSalaries.push(salary);
    return of(salary);
  }

  updateEmployeeSalary(salary: IEmployeeSalary): Observable<IEmployeeSalary> {
    const index = this.employeeSalaries.findIndex(emp => emp.employeeId === salary.employeeId);
    if (index !== -1) {
      this.employeeSalaries[index] = salary;
    }
    return of(salary);
  }

  deleteEmployeeSalary(employeeId: number): Observable<boolean> {
    const index = this.employeeSalaries.findIndex(emp => emp.employeeId === employeeId);
    if (index !== -1) {
      this.employeeSalaries.splice(index, 1);
      return of(true);
    }
    return of(false);
  }

  getMonths(): string[] {
    return [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
  }

  getYears(): string[] {
    const currentYear = new Date().getFullYear();
    const years: string[] = [];
    for (let i = currentYear - 5; i <= currentYear + 1; i++) {
      years.push(i.toString());
    }
    return years;
  }
} 