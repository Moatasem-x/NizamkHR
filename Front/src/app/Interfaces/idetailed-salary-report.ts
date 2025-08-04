import { IAttendance } from "./iattendance";

export interface IDetailedSalaryReport {
    attendances: IAttendance[];
    overtimeAmount: number;
    delayAmount: number;
    overTimeSummation: number;
    delaySummation: number;
}
