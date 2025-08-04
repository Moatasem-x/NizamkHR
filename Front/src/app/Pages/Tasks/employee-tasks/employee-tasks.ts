import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TasksService } from '../../../Services/tasks-service';
import { AuthService } from '../../../Services/auth-service';
import { ITask } from '../../../Interfaces/itask';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-employee-tasks',
  standalone: true,
  imports: [CommonModule, NgxSpinnerModule],
  templateUrl: './employee-tasks.html',
  styleUrl: './employee-tasks.css'
})
export class EmployeeTasks implements OnInit {
  tasks: ITask[] = [];
  filteredTasks: ITask[] = [];
  statusFilter: 'All' | 'Pending' | 'Done' | 'Late' = 'All';

  constructor(private tasksService: TasksService, private authService: AuthService, private cdr: ChangeDetectorRef, private spinner: NgxSpinnerService) {}

  ngOnInit() {
    this.spinner.show();
    this.loadTasks();
  }

  loadTasks() {
    const employeeId = this.authService.getUserId();
    if (!employeeId) return;
    this.tasksService.getTasksByEmployeeId(employeeId).subscribe({
      next: (tasks) => {
        this.tasks = tasks || [];
        this.cdr.detectChanges(); // Ensure view updates after filtering
      },
      error: (err) => {
        this.tasks = [];
        this.filteredTasks = [];
        this.cdr.detectChanges();
        this.spinner.hide();
      },
      complete: () => {
        this.applyFilter();
        this.cdr.detectChanges();
      }
    });
  }

  applyFilter() {
    if (this.statusFilter === 'All') {
      this.filteredTasks = this.tasks;
    } else {
      this.filteredTasks = this.tasks.filter(t => t.status === this.statusFilter);
    }
    this.cdr.detectChanges();
    this.spinner.hide();
  }

  setStatusFilter(status: 'All' | 'Pending' | 'Done' | 'Late') {
    this.statusFilter = status;
    this.applyFilter();
  }

  markAsDone(task: ITask) {
    const update: ITask = { taskId: task.taskId, status: 'Done' };
    this.tasksService.takeActionForTask(update).subscribe({
      next: (resp) => {
        task.status = resp.status;
      },
      error: () => {
        console.log("Error");
      },
      complete: () => {
        this.applyFilter();
        this.cdr.detectChanges();
      }
    });
  }
}
