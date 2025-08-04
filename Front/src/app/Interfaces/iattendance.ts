export interface IAttendance {
    attendanceId?: number;
    employeeName?: string;
    employeeId?: number;
    departmentName?: string;
    checkInTime?: string;
    checkOutTime?: string;
    overtimeHours?: number;
    delayHours?: number;
    attendanceDate?: string;
    latitude?: number;
    longitude?: number;
}
