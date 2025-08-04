export interface ISalaryReport {
    employeeId: number;
    employeeName: string;
    departmentName: string;
    month: number;
    year: number;
    basicSalary: number;
    overtimeAmount: number;
    deductionAmount: number;
    netSalary: number;
}
