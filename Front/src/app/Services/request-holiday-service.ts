import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IRequestHoliday } from '../Interfaces/irequest-holiday';
import { IHolidayType } from '../Interfaces/iholiday-type';

@Injectable({
  providedIn: 'root'
})
export class RequestHolidayService {
  private apiUrl = 'https://localhost:7124/api/leave';
  private apiUrl2 = 'https://localhost:7124/api/LeaveType';

  constructor(private http: HttpClient) {}

  getRequestHolidays(): Observable<IRequestHoliday[]> {
    return this.http.get<IRequestHoliday[]>(`${this.apiUrl}/requests`);
  }

  getHolidayTypes(): Observable<IHolidayType[]> {
    return this.http.get<IHolidayType[]>(`${this.apiUrl}/types`);
  }

  addHolidayRequest(requestHoliday: IRequestHoliday): Observable<IRequestHoliday> {
    return this.http.post<IRequestHoliday>(`${this.apiUrl}`, requestHoliday);
  }

  takeActionOnRequest(requestId: number, action: string): Observable<IRequestHoliday> {
    return this.http.put<IRequestHoliday>(`${this.apiUrl}/${requestId}?Status=${action}`, {});
  }

  addHolidayType(holidayType: IHolidayType): Observable<IHolidayType> {
    return this.http.post<IHolidayType>(`${this.apiUrl2}`, holidayType);
  }

  deleteHolidayType(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl2}/${id}`);
  }
}
