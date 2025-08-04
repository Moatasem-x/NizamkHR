import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { DepartmentService } from '../../../Services/department-service';
import { EmployeeService } from '../../../Services/employee-service';
import { IDepartment } from '../../../Interfaces/idepartment';
import { IEmployee } from '../../../Interfaces/iemployee';
import { TasksService } from '../../../Services/tasks-service';
import { ITask } from '../../../Interfaces/itask';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { trigger, style, animate, transition, query, group } from '@angular/animations';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NgxSpinnerModule],
  templateUrl: './tasks.html',
  styleUrl: './tasks.css',
  animations: [
    trigger("expand",[
      transition(":enter", [
        style({height: 0,opacity: 0}),
        query(".details",[
          style({translate: "0 -100%"})
        ]),
        group([
          animate("0.8s cubic-bezier(0.4, 0, 0.2, 1)", style({height: "*", opacity: 1})),
          query(".details",[
            animate("0.8s cubic-bezier(0.4, 0, 0.2, 1)", style({translate: "0 0"}))
          ])
        ])
      ]),
      transition(":leave",[
        style({height: "*", opacity: 1}),
        query(".details",[
          style({translate: "0 0"})
        ]),
        group([
          animate("0.8s cubic-bezier(0.4, 0, 0.2, 1)", style({height: 0,opacity: 0})),
          query(".details",[
            animate("0.8s cubic-bezier(0.4, 0, 0.2, 1)", style({translate: "0 -100%"}))
          ])
        ])
      ])
    ])
  ]
})
export class Tasks implements OnInit, OnDestroy {
  tasks: ITask[] = [];
  displayTasks: ITask[] = []; // Tasks to display (either filtered or all)
  departments: IDepartment[] = [];
  employees: IEmployee[] = [];
  filteredEmployees: IEmployee[] = [];
  showAddForm = false;
  error: string | null = null;
  taskForm!: FormGroup;
  subs: Subscription[] = [];

  // New properties for grouping and search
  searchTerm = '';
  selectedGroup = 'All';
  expandedGroups = new Set<string>([]);
  isNavigatingAway = false;

  constructor(
    private departmentService: DepartmentService,
    private employeeService: EmployeeService,
    private tasksService: TasksService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private spinner: NgxSpinnerService
  ) {}

  ngOnInit() {
    this.spinner.show();
    this.initForm();
    this.loadDepartments();
    this.loadTasks();
  }

  initForm() {
    this.taskForm = this.fb.group({
      departmentId: [null, Validators.required],
      employeeId: [null, Validators.required],
      description: ['', [Validators.required, Validators.minLength(5)]],
      dueDate: ['', Validators.required]
    });
  }

  get departmentId() { return this.taskForm.get('departmentId'); }
  get employeeId() { return this.taskForm.get('employeeId'); }
  get description() { return this.taskForm.get('description'); }
  get dueDate() { return this.taskForm.get('dueDate'); }

  // Get departments for grouping
  get departmentsForGrouping(): string[] {
    const allDepartments = this.tasks.map(t => t.departmentName || 'Unknown');
    return ['All', ...Array.from(new Set(allDepartments))];
  }

  // Get grouped tasks
  get groupedTasks(): { [group: string]: ITask[] } {
    const groups: { [group: string]: ITask[] } = {};
    for (const task of this.displayTasks) {
      const deptName = task.departmentName || 'Unknown';
      if (!groups[deptName]) groups[deptName] = [];
      groups[deptName].push(task);
    }
    return groups;
  }

  loadDepartments() {
    this.subs.push(this.departmentService.getDepartments().subscribe({
      next: (departments: IDepartment[]) => {
        this.departments = departments.filter(d=>d.departmentName!="HR");
      },
      error: () => {
        this.spinner.hide();
      },
      complete: () => {
        this.spinner.hide();
      }
    }));
  }

  loadEmployees() {
    this.subs.push(this.employeeService.getEmployees().subscribe({
      next: (resp) => {
        this.employees = resp;
        this.cdr.detectChanges();
      }
    }));
  }

  onDepartmentChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const deptId = target.value;
    if (!deptId) return;
    const id = Number(deptId);
    console.log("DeptID", deptId)
    this.filteredEmployees = this.employees.filter(e => e.departmentId == id);
    this.taskForm.patchValue({ employeeId: null });
    console.log(this.filteredEmployees);
  }

  loadTasks() {
    this.subs.push(this.tasksService.getAllTasks().subscribe({
      next: (tasks) => {
        this.tasks = tasks;
        this.displayTasks = tasks; // Initially show all tasks
        this.cdr.detectChanges();
      },
      error: () => {
        this.spinner.hide();
      },
      complete: () => {
        this.expandedGroups.add('All');
        this.cdr.detectChanges();
        this.spinner.hide();
      }
    }));
  }

  // Group management methods
  isGroupExpanded(group: string): boolean {
    return this.expandedGroups.has(group);
  }

  toggleGroup(group: string): void {
    if (this.expandedGroups.has(group)) {
      this.expandedGroups.delete(group);
    } else {
      this.expandedGroups.add(group);
    }
  }

  // Filter tasks by group and search
  getTasksByGroup(): ITask[] {
    const selected = this.selectedGroup.trim().toLowerCase();
    return this.tasks.filter(t => {
      const group = (t.departmentName || 'Unknown').trim().toLowerCase();
      const matchesGroup = selected === 'all' || group === selected;
      const term = this.searchTerm.trim().toLowerCase();
      const matchesSearch = !term ||
        (t.employeeName && t.employeeName.toLowerCase().includes(term));
      return matchesGroup && matchesSearch;
    });
  }

  // Apply filters
  applyFilters() {
    this.spinner.show();
    this.currentPage = 1;
    this.displayTasks = this.getTasksByGroup();
    this.cdr.detectChanges();
    this.spinner.hide();
  }

  // Clear all filters
  clearFilters() {
    this.searchTerm = '';
    this.selectedGroup = 'All';
    this.currentPage = 1;
    this.displayTasks = [...this.tasks]; // Show all tasks
    this.cdr.detectChanges();
  }

  showAddTaskForm() {
    this.showAddForm = true;
    this.taskForm.reset();
    this.error = null;
    if (!this.employees.length) this.loadEmployees();
  }

  hideAddTaskForm() {
    this.showAddForm = false;
    this.taskForm.reset();
    this.error = null;
  }

  onSubmit() {
    if (this.taskForm.invalid) {
      this.taskForm.markAllAsTouched();
      return;
    }
    this.spinner.show();
    const newTask: ITask = {
      employeeId: this.taskForm.value.employeeId,
      description: this.taskForm.value.description,
      dueDate: this.taskForm.value.dueDate
    };
    this.subs.push(this.tasksService.addTask(newTask).subscribe({
      next: (task: any) => {
        this.tasks.push(task);
        // this.displayTasks.push(task); // Also add to display array
        this.hideAddTaskForm();
        this.cdr.detectChanges();
        Swal.fire({
          title: "Success!",
          text: "Task added successfully",
          icon: "success"
        });
      },
      error: (err) => {
        this.spinner.hide();
        Swal.fire({
          title: "Error!",
          text: "Failed to add task. Please try again.",
          icon: "error"
        });
      },
      complete: () => {
        this.spinner.hide();
      }
    }));
  }

  // Edit and delete methods
  editTask(taskId: number | undefined) {
    if (!taskId) return;
    this.isNavigatingAway = true;
    setTimeout(() => {
      // Navigate to edit task page or show edit modal
      console.log('Edit task:', taskId);
      this.isNavigatingAway = false;
    }, 200);
  }

  deleteTask(taskId: number | undefined) {
    if (!taskId) return;
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes"
    }).then((result) => {
      if (result.isConfirmed) {
        this.subs.push(this.tasksService.deleteTask(taskId).subscribe({
          next: (resp) => {
            Swal.fire({
              title: "Deleted!",
              text: "Task has been deleted.",
              icon: "success"
            });
            this.tasks = this.tasks.filter(t => t.taskId !== taskId);
            this.displayTasks = this.displayTasks.filter(t => t.taskId !== taskId); // Also remove from display array
            this.cdr.detectChanges();
          },
          error: (err) => {
            Swal.fire({
              icon: "error",
              title: "Oops...",
              text: "Something went wrong!",
            });
            console.log(err);
          }
        }));
      }
    });
  }

  pageSize = 10;
  currentPage = 1;

  get paginatedTasks() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.displayTasks.slice(start, start + this.pageSize);
  }

  get totalPages() {
    return Math.ceil(this.displayTasks.length / this.pageSize);
  }

  ngOnDestroy(): void {
    this.subs.forEach(sub => sub.unsubscribe());
  }
} 