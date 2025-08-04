export interface IEmployee {
    employeeId: number;
    fullName: string;
    email: string;
    password: string;
    address: string;
    phoneNumber: string;
    nationalId: string;
    gender: string;
    hireDate: string;
    salary: number;
    departmentId: number;
    departmentName: string;
    image?: File;
    workStartTime?: string;
    workEndTime?: string;
}
