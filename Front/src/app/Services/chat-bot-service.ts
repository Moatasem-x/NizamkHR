import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IChatBot } from '../Interfaces/ichat-bot';

@Injectable({
  providedIn: 'root'
})
export class ChatBotService {

  constructor(private http: HttpClient) {}

  private apiUrl = 'https://localhost:7124/api/Chat';

  getWelcomeMessage(): Observable<IChatBot> {
    return this.http.get<IChatBot>(`${this.apiUrl}/Welcome`);
  }  

  sendMessage(message: string): Observable<IChatBot> {
    return this.http.post<IChatBot>(`${this.apiUrl}/Message`, { message: message });
  }
}
