export interface IRequestHoliday {
    id?: number;
    employeeId?: number;
    employeeName?: string;
    leaveTypeId?: number;
    leaveTypeName?: string;
    startDate: string;
    endDate: string;
    reason: string;
    status?: string;
    requestedAt?: string;
}
