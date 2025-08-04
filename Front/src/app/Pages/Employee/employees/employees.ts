import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { trigger, style, animate, transition, query, group } from '@angular/animations';
import { IEmployee } from '../../../Interfaces/iemployee';
import { Subscription } from 'rxjs';
import { EmployeeService } from '../../../Services/employee-service';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import Swal from 'sweetalert2';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../Services/auth-service';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import {NgxPrintModule} from 'ngx-print';
import * as jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface BoardMember {
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
}

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [FormsModule, CommonModule, SweetAlert2Module, RouterLink, NgxSpinnerModule, NgxPrintModule],
  templateUrl: './employees.html',
  styleUrls: ['./employees.css'],
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
export class Employees implements OnInit, OnDestroy {
  @ViewChild('printSection') printSectionRef!: ElementRef;

  constructor(private employeeService: EmployeeService, private cdr: ChangeDetectorRef, private authService: AuthService, private router: Router, private spinner: NgxSpinnerService) {}

  ngOnInit(): void {
    this.subs.push(this.authService.userRole.subscribe({
      next: () => {
        this.userRole = this.authService.userRole.getValue() || "";
        console.log("User Role", this.userRole); 
      }
    }));
    this.spinner.show();
    this.loadEmployees();
  }



  boardMembers: BoardMember[] = [
    { name: "Al-Mo'tasem Bellah Emad ", email: 'moatasem@nizamkhr.com', role: 'General Director', avatarUrl: '/moatasem.webp' },
    { name: 'Amr Ehab', email: 'amrehab@nizamkhr.com', role: 'The CEO', avatarUrl: '/amr.jpg' },
    { name: 'AbdelRahman Ragae', email: 'abdelrahmanragae@nizamkhr.com', role: 'The CTO', avatarUrl: '' },
    { name: 'Amera Gomaa', email: 'amera@nizamkhr.com', role: 'The CMO', avatarUrl: '' },
    { name: 'Somaya Yasser', email: 'Somaya@nizamkhr.com', role: 'The CFO', avatarUrl: '' },
  ];

  employees: IEmployee[] = [];
  subs: Subscription[] = [];
  userRole: string= "";

  searchTerm = '';

  selectedGroup = 'All';
  get departments(): string[] {
    const allDepartments = this.employees.map(e => e.departmentName);
    return ['All', ...Array.from(new Set(allDepartments))];
  }

  expandedGroups = new Set<string>([]); 

  get groupedEmployees(): { [group: string]: IEmployee[] } {
    const groups: { [group: string]: IEmployee[] } = {};
    for (const emp of this.getEmployeesByGroup()) {
      if (!groups[emp.departmentName]) groups[emp.departmentName] = [];
      groups[emp.departmentName].push(emp);
    }
    return groups;
  }

  loadEmployees() {
    this.subs.push(this.employeeService.getEmployees().subscribe({
      next: (resp) => {
        this.employees = resp;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.spinner.hide();
      },
      complete: () => {
        this.expandedGroups.add('All');
        this.cdr.detectChanges();
        this.spinner.hide();
      }
    }));
  }

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

  isNavigatingAway = false;

  editEmployee(employeeId: number) {
    this.isNavigatingAway = true;
    setTimeout(() => {
      this.router.navigate(['/addemployee', employeeId]);
    }, 200); // match your collapse animation duration
  }

  deleteEmployee(empId: number) {
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
        this.subs.push(this.employeeService.deleteEmployee(empId).subscribe({
          next: (resp) => {
            Swal.fire({
              title: "Deleted!",
              text: "Employee has been deleted.",
              icon: "success"
            });
            this.employees = this.employees.filter(e => e.employeeId !== empId);
            this.cdr.detectChanges();
          },
          error: (err) => {
            Swal.fire({
              icon: "error",
              title: "Oops...",
              text: "Something went wrong!",
            });
            console.log(err);
          },
          complete: () => {
          }
        }));
      }
    });
    
  }

  getEmployeesByGroup(): IEmployee[] {
    const selected = this.selectedGroup.trim().toLowerCase();
    return this.employees.filter(e => {
      const group = e.departmentName.trim().toLowerCase();
      const matchesGroup = selected === 'all' || group === selected;
      const term = this.searchTerm.trim().toLowerCase();
      const matchesSearch = !term ||
        e.fullName.toLowerCase().includes(term) ||
        e.email.toLowerCase().includes(term);
      return matchesGroup && matchesSearch;
    });
  }

  pageSize = 10;
  currentPage = 1;

  get paginatedEmployees() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.getEmployeesByGroup().slice(start, start + this.pageSize);
  }

  get totalPages() {
    return Math.ceil(this.getEmployeesByGroup().length / this.pageSize);
  }

  ngOnDestroy(): void {
    this.subs.forEach(sub => sub.unsubscribe());
  }

  print() {
    const printContents = this.printSectionRef.nativeElement.outerHTML;
    const popupWin = window.open('', '_blank', 'width=900,height=650');
    if (popupWin) {
      popupWin.document.open();
      popupWin.document.write(`
        <html>
          <head>
            <title>Print Table</title>
            <link rel="stylesheet" type="text/css" href="/styles.css" />
          </head>
          <body>
            ${printContents}
            <script>
              setTimeout(function() {
                window.print();
                window.close();
              }, 500);
            <\/script>
          </body>
        </html>
      `);
      popupWin.document.close();
    }
  }

  isExporting = false;
  showExportTable = false;

  exportPDF() {
    const data = document.getElementById('export-table');
    html2canvas(data!, {
      scale: 2, // Higher resolution for clarity
      useCORS: true
    }).then(canvas => {
      const imgWidth = 295; // A4 landscape width in mm
      const pageHeight = 210; // A4 landscape height in mm
      const imgHeight = canvas.height * imgWidth / canvas.width;
      const contentDataURL = canvas.toDataURL('image/png');
      const pdf = new jsPDF.jsPDF('l', 'mm', 'a4'); // 'l' for landscape
      let position = 0;
      let heightLeft = imgHeight;

      // Multi-page support
      while (heightLeft > 0) {
        pdf.addImage(contentDataURL, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        if (heightLeft > 0) {
          pdf.addPage();
          position = 0;
        }
      }
      pdf.save('exported-file.pdf');
      this.showExportTable = false;
      this.cdr.detectChanges();
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
}

