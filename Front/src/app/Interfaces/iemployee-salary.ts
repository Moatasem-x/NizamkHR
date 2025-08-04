export interface IEmployeeSalary {
    employeeId: number;
    employeeName: string;
    department: string;
    basicSalary: number;
    attendanceDays: number;
    absenceDays: number;
    overtimeHours: number;
    deductionHours: number;
    totalOvertime: number;
    totalDeduction: number;
    netSalary: number;
}

export interface IEmployeeSalaryFilter {
    employeeName: string;
    month: string;
    year: string;
} 