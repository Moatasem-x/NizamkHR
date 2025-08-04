import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { IOfficialHoliday } from '../Interfaces/iofficial-holiday';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OfficialHolidayService {

  constructor(private http: HttpClient) {}

  private apiUrl = 'https://localhost:7124/api/OfficalHoliday';

  getOfficialHolidays(): Observable<IOfficialHoliday[]> {
    return this.http.get<IOfficialHoliday[]>(`${this.apiUrl}`);
  }

  addOfficialHoliday(holiday: IOfficialHoliday): Observable<IOfficialHoliday> {
    return this.http.post<IOfficialHoliday>(`${this.apiUrl}`, holiday);
  }

  deleteOfficialHoliday(id: number): Observable<IOfficialHoliday> {
    return this.http.delete<IOfficialHoliday>(`${this.apiUrl}/${id}`);
  }

  editOfficialHoliday(holiday: IOfficialHoliday, id:number): Observable<IOfficialHoliday> {
    return this.http.put<IOfficialHoliday>(`${this.apiUrl}/${id}`, holiday);
  }
  
}
