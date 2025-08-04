import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ISystemSettings } from '../Interfaces/isystem-settings';

@Injectable({
  providedIn: 'root'
})
export class SystemSettingService {

  private apiUrl = 'https://localhost:7124/api/systemSettings';

  constructor(private http: HttpClient) { }

  getCurrentSystemSettings(): Observable<ISystemSettings> {
    return this.http.get<ISystemSettings>(this.apiUrl);
  }

  updateSystemSettings(id: number, systemSettings: ISystemSettings): Observable<ISystemSettings> {
    return this.http.put<ISystemSettings>(`${this.apiUrl}/${id}`, systemSettings);
  }
  
}
