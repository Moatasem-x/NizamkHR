import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { IEmployee } from '../Interfaces/iemployee';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HRService {
  constructor(private http: HttpClient) {}
  private apiUrl = 'https://localhost:7124/api/Auth/register-hr';

  addHR(hr: FormData): Observable<IEmployee> {
    return this.http.post<IEmployee>(this.apiUrl, hr);
  }
}
