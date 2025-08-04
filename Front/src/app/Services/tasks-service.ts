import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ITask } from '../Interfaces/itask';

@Injectable({
  providedIn: 'root'
})
export class TasksService {
  private apiUrl = 'https://localhost:7124/api/WorkingTask';

  constructor(private http: HttpClient) {}

  getAllTasks(): Observable<ITask[]> {
    return this.http.get<ITask[]>(`${this.apiUrl}/All`);
  }

  addTask(task: ITask): Observable<ITask> {
    return this.http.post<ITask>(`${this.apiUrl}`, task);
  }

  deleteTask(taskId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${taskId}`);
  }

  getTasksByEmployeeId(employeeId: number): Observable<ITask[]> {
    return this.http.get<ITask[]>(`${this.apiUrl}/Employee/tasks/${employeeId}`);
  }

  takeActionForTask(task: ITask): Observable<ITask> {
    return this.http.put<ITask>(`${this.apiUrl}/Employee`, task);
  }
} 