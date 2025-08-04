import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, style, animate, transition, query, group } from '@angular/animations';
import { AttendanceService } from '../../../Services/attendance-service';
import { IAttendance } from '../../../Interfaces/iattendance';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-attendance-report-combine',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxSpinnerModule],
  templateUrl: './attendance-report-combine.html',
  styleUrls: ['./attendance-report-combine.css'],
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
export class AttendanceReportCombine implements OnInit, OnDestroy {
  allRecords: IAttendance[] = [];
  filteredRecords: IAttendance[] = [];
  displayRecords: IAttendance[] = []; // Records to display (either filtered or all)
  subs: Subscription[] = [];

  // New properties for grouping and search
  searchTerm = '';
  fromDate = '';
  toDate = '';
  expandedGroups = new Set<string>([]);
  isNavigatingAway = false;

  // Edit functionality
  editAttendanceId: number | null = null;
  editedRecord: IAttendance | null = null;

  constructor(private attendanceService: AttendanceService, private cdr: ChangeDetectorRef, private spinner: NgxSpinnerService) {}

  ngOnInit() {
    this.spinner.show();
    this.loadRecords();
  }

  loadRecords() {
    this.subs.push(this.attendanceService.getAttendances().subscribe({
      next: (records) => {
        this.allRecords = records;
        this.filteredRecords = records;
        this.displayRecords = records; // Initially show all records
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.spinner.hide();
      },
      complete: () => {
        this.expandedGroups.add('All');
        this.cdr.detectChanges();
        this.spinner.hide();
      }
    }));
  }

  // Get date groups for grouping
  get dateGroups(): string[] {
    const allDates = this.displayRecords.map(r => r.attendanceDate || 'Unknown');
    const uniqueDates = Array.from(new Set(allDates));
    // Sort dates in descending order (newest first)
    const sortedDates = uniqueDates.sort((a, b) => {
      if (a === 'Unknown' || b === 'Unknown') return 0;
      return new Date(b).getTime() - new Date(a).getTime();
    });
    return ['All', ...sortedDates];
  }

  // Get grouped attendance
  get groupedAttendance(): { [group: string]: IAttendance[] } {
    const groups: { [group: string]: IAttendance[] } = {};
    for (const record of this.displayRecords) {
      const date = record.attendanceDate || 'Unknown';
      if (!groups[date]) groups[date] = [];
      groups[date].push(record);
    }
    
    // Sort records within each group by employee name
    Object.keys(groups).forEach(date => {
      groups[date].sort((a, b) => {
        const nameA = a.employeeName || '';
        const nameB = b.employeeName || '';
        return nameA.localeCompare(nameB);
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

  // Filter attendance by search and date filters
  getAttendanceByGroup(): IAttendance[] {
    let filtered = this.allRecords;
    
    // Apply date filters
    if (this.fromDate) {
      filtered = filtered.filter(r => r.attendanceDate && r.attendanceDate >= this.fromDate);
    }
    if (this.toDate) {
      filtered = filtered.filter(r => r.attendanceDate && r.attendanceDate <= this.toDate);
    }
    
    // Apply search filter
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.trim().toLowerCase();
      filtered = filtered.filter(r => 
        r.employeeName && r.employeeName.toLowerCase().includes(term)
      );
    }
    
    // Sort by date in descending order (newest first)
    return filtered.sort((a, b) => {
      if (!a.attendanceDate || !b.attendanceDate) return 0;
      return new Date(b.attendanceDate).getTime() - new Date(a.attendanceDate).getTime();
    });
  }

  // Apply filters
  applyFilters() {
    this.spinner.show();
    this.displayRecords = this.getAttendanceByGroup();
    this.cdr.detectChanges();
    this.spinner.hide();
  }

  // Clear all filters
  clearFilters() {
    this.searchTerm = '';
    this.fromDate = '';
    this.toDate = '';
    this.displayRecords = [...this.allRecords]; // Show all records
    this.cdr.detectChanges();
  }

  // Edit functionality
  editRecord(attendanceId: number) {
    const record = this.displayRecords.find(r => r.attendanceId == attendanceId);
    if (!record) return;
    this.editAttendanceId = attendanceId;
    this.editedRecord = { ...record };
  }

  saveRecord(attendanceId: number) {
    if (!this.editedRecord) return;
    this.spinner.show();
    this.subs.push(this.attendanceService.adminUpdatesAttendance(this.editedRecord).subscribe({
      next: (updatedRecord) => {
        const index = this.displayRecords.findIndex(r => r.attendanceId == attendanceId);
        if (index != -1) this.displayRecords[index] = updatedRecord;
        this.allRecords = this.allRecords.map(r => 
          r.attendanceId === updatedRecord.attendanceId ? updatedRecord : r
        );
        this.cancelEdit();
        this.applyFilters();
        Swal.fire({
          title: "Success!",
          text: "Attendance record updated successfully",
          icon: "success"
        });
      },
      error: (err) => {
        this.spinner.hide();
        console.error('Error updating attendance record:', err);
        Swal.fire({
          title: "Error!",
          text: "Failed to update attendance record. Please try again.",
          icon: "error"
        });
      },
      complete: () => {
        this.spinner.hide();
      }
    }));
  }

  cancelEdit() {
    this.editAttendanceId = null;
    this.editedRecord = null;
  }

  deleteRecord(attendanceId: number) {
    const index = this.displayRecords.findIndex(r => r.attendanceId === attendanceId);
    if (index == -1) return;
    const record = this.displayRecords[index];
    if (!record.attendanceId) return;

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
        this.spinner.show();
        this.subs.push(this.attendanceService.deleteAttendance(record.attendanceId!).subscribe({
          next: (resp) => {
            Swal.fire({
              title: "Deleted!",
              text: "Attendance record has been deleted.",
              icon: "success"
            });
            this.displayRecords.splice(index, 1);
            this.allRecords = this.allRecords.filter(r => r.attendanceId != record.attendanceId);
            this.cdr.detectChanges();
          },
          error: (err) => {
            this.spinner.hide();
            Swal.fire({
              icon: "error",
              title: "Oops...",
              text: "Something went wrong!",
            });
            console.log(err);
          },
          complete: () => {
            this.spinner.hide();
          }
        }));
      }
    });
  }

  private saveExcelFile(buffer: any, fileName: string): void {
    const data: Blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    saveAs(data, fileName + '.xlsx');
  }

  exportArrayToExcel(data: any[], fileName: string = 'ExportedData') {
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    const excelBuffer: any = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    this.saveExcelFile(excelBuffer, fileName);
  }

  pageSize = 10;
  currentPage = 1;

  get paginatedDisplayRecords() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.displayRecords.slice(start, start + this.pageSize);
  }

  get totalPages() {
    return Math.ceil(this.displayRecords.length / this.pageSize);
  }

  ngOnDestroy(): void {
    this.subs.forEach(sub => sub.unsubscribe());
  }
} 