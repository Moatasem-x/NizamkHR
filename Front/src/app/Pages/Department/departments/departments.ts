import { Component, OnInit, OnDestroy, ChangeDetectorRef, ApplicationRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { trigger, style, animate, transition, query, group } from '@angular/animations';
import { DepartmentService } from '../../../Services/department-service';
import { IDepartment } from '../../../Interfaces/idepartment';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-departments',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NgxSpinnerModule],
  templateUrl: './departments.html',
  styleUrl: './departments.css',
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
export class Departments implements OnInit, OnDestroy {
  departments: IDepartment[] = [];
  displayDepartments: IDepartment[] = [];
  showAddForm = false;
  error: string | null = null;
  departmentForm!: FormGroup;
  subs: Subscription[] = [];
  editIndex: number | null = null;
  editingDepartmentId: number | null = null;
  editForm!: FormGroup;

  // New properties for grouping and search
  searchTerm = '';
  expandedGroups = new Set<string>([]);
  isNavigatingAway = false;

  constructor(
    private departmentService: DepartmentService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private appRef: ApplicationRef,
    private spinner: NgxSpinnerService
  ) {}

  ngOnInit() {
    this.spinner.show();
    this.initForm();
    this.loadDepartments();
  }

  initForm() {
    this.departmentForm = this.fb.group({
      departmentName: ['', [Validators.required, Validators.minLength(2)]],
      description: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  get departmentName() { return this.departmentForm.get('departmentName'); }
  get description() { return this.departmentForm.get('description'); }

  get nameCtrl() {
    return this.editForm ? this.editForm.get('departmentName') : null;
  }
  get descCtrl() {
    return this.editForm ? this.editForm.get('description') : null;
  }

  // Get alphabet groups for grouping
  get alphabetGroups(): string[] {
    const allFirstLetters = this.displayDepartments.map(d => d.departmentName.charAt(0).toUpperCase());
    return ['All', ...Array.from(new Set(allFirstLetters)).sort()];
  }

  // Get grouped departments
  get groupedDepartments(): { [group: string]: IDepartment[] } {
    const groups: { [group: string]: IDepartment[] } = {};
    for (const dept of this.displayDepartments) {
      const firstLetter = dept.departmentName.charAt(0).toUpperCase();
      if (!groups[firstLetter]) groups[firstLetter] = [];
      groups[firstLetter].push(dept);
    }
    // Sort records within each group by department name
    Object.keys(groups).forEach(letter => {
      groups[letter].sort((a, b) => {
        return a.departmentName.localeCompare(b.departmentName);
      });
    });
    return groups;
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

  // Filter departments by search
  getDepartmentsByGroup(): IDepartment[] {
    let filtered = this.departments;
    // Apply search filter
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.trim().toLowerCase();
      filtered = filtered.filter(d => 
        d.departmentName.toLowerCase().includes(term)
      );
    }
    // Sort alphabetically by department name
    return filtered.sort((a, b) => a.departmentName.localeCompare(b.departmentName));
  }

  // Apply filters
  applyFilters() {
    this.spinner.show();
    this.displayDepartments = this.getDepartmentsByGroup();
    this.cdr.detectChanges();
    this.spinner.hide();
  }

  // Clear all filters
  clearFilters() {
    this.searchTerm = '';
    this.displayDepartments = [...this.departments];
    this.cdr.detectChanges();
  }

  loadDepartments() {
    this.subs.push(this.departmentService.getDepartments().subscribe({
      next: (departments) => {
        this.departments = departments;
        this.displayDepartments = departments;
        this.cdr.detectChanges();
        this.appRef.tick();
      },
      error: (err: any) => {
        this.error = 'Failed to load departments.';
      },
      complete: () => {
        this.expandedGroups.add('All');
        this.cdr.detectChanges();
        this.spinner.hide();
      }
    }));
  }

  showAddDepartmentForm() {
    this.showAddForm = true;
    this.departmentForm.reset();
    this.error = null;
  }

  hideAddDepartmentForm() {
    this.showAddForm = false;
    this.departmentForm.reset();
    this.error = null;
  }

  onSubmit() {
    this.spinner.show();
    if (this.departmentForm.invalid) {
      this.departmentForm.markAllAsTouched();
      return;
    }
    const newDepartment: IDepartment = this.departmentForm.value;
    this.subs.push(this.departmentService.addDepartment(newDepartment).subscribe({
      next: (department: IDepartment) => {
        this.departments.push(department);
        // this.displayDepartments.push(department);
        this.hideAddDepartmentForm();
        this.cdr.detectChanges();
        Swal.fire({
          title: "Success!",
          text: "Department has been added successfully.",
          icon: "success",
          timer: 1500,
          showConfirmButton: false
        });
      },
      error: (err: any) => {
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: "Failed to add department. Please try again.",
        });
        this.error = err?.error?.message || 'Failed to add department.';
      },
      complete: () => {
        this.spinner.hide();
      }
    }));
  }

  deleteDepartment(departmentId: number) {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!"
    }).then((result) => {
      if (result.isConfirmed) {
        this.subs.push(this.departmentService.deleteDepartment(departmentId).subscribe({
          next: () => {
            this.departments = this.departments.filter(d => d.departmentId != departmentId);
            this.displayDepartments = this.displayDepartments.filter(d => d.departmentId != departmentId);
            this.cdr.detectChanges();
            Swal.fire({
              title: "Success!",
              text: "Department has been deleted successfully.",
              icon: "success",
              timer: 1500,
              showConfirmButton: false
            });
          },
          error: (err) => {
            if (err.error.message == "Department has employees") {
              Swal.fire({
                icon: "error",
                title: "Oops...",
                text: "Department has employees.",
              });
            } 
            else {
              Swal.fire({
                icon: "error",
                title: "Oops...",
                text: "Failed to delete department. Please try again.",
              });
            }
            
          }
        }));
      }
    });
  }

  startEditDepartment(departmentId: number) {
    this.editingDepartmentId = departmentId;
    const dept = this.displayDepartments.find(d => d.departmentId === departmentId);
    if (!dept) return;
    this.editForm = this.fb.group({
      departmentName: [dept.departmentName, [Validators.required, Validators.minLength(2)]],
      description: [dept.description, [Validators.required, Validators.minLength(10)]]
    });
  }

  cancelEditDepartment() {
    this.editingDepartmentId = null;
  }

  saveEditDepartment(departmentId: number) {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }
    const deptIndex = this.departments.findIndex(d => d.departmentId === departmentId);
    const displayIndex = this.displayDepartments.findIndex(d => d.departmentId === departmentId);
    if (deptIndex === -1 || displayIndex === -1) return;
    const updated: IDepartment = {
      ...this.departments[deptIndex],
      departmentName: this.editForm.value.departmentName,
      description: this.editForm.value.description
    };
    this.subs.push(this.departmentService.editDepartment(updated).subscribe({
      next: (resp) => {
        this.departments[deptIndex] = resp;
        this.displayDepartments[displayIndex] = resp;
        this.editingDepartmentId = null;
        this.cdr.detectChanges();
        Swal.fire({
          title: "Success!",
          text: "Department has been updated successfully.",
          icon: "success",
          timer: 1500,
          showConfirmButton: false
        });
      },
      error: () => {
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: "Failed to update department. Please try again.",
        });
      }
    }));
  }

  ngOnDestroy(): void {
    this.subs.forEach(sub => sub.unsubscribe());
  }
} 