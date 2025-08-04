import { Component, ChangeDetectorRef, OnInit, EventEmitter, Output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../Services/auth-service';
import { trigger, state, style, animate, transition } from '@angular/animations';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
  animations: [
    trigger('labelSlide', [
      state('hidden', style({
        transform: 'translateX(-100%)',
        opacity: 0,
        pointerEvents: 'none',
      })),
      state('visible', style({
        transform: 'translateX(0)',
        opacity: 1,
        pointerEvents: 'auto',
      })),
      transition('hidden <=> visible', [
        animate('300ms cubic-bezier(0.4,0,0.2,1)')
      ])
    ])
  ]
})
export class Sidebar implements OnInit {
  isExpanded = false;
  private collapseTimeout: any;
  isloggedin = false;
  role: string | null = "";
  @Output() openUpdateProfile = new EventEmitter<void>();
  @Output() openSystemSettings = new EventEmitter<void>();

  constructor(private cdr: ChangeDetectorRef, private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.userData.subscribe({
      next: () => {
        if(this.authService.userData.getValue() != null)
        {
          this.isloggedin = true;
          this.role = this.authService.getRole();
        }
        else
        {
          this.isloggedin = false;
        }
      },
      error: () => {
        this.isloggedin = false;
      }
    });
  }

  onSidebarEnter() {
    if (this.collapseTimeout) {
      clearTimeout(this.collapseTimeout);
    }
    this.isExpanded = true;
  }

  onSidebarLeave() {
    this.collapseTimeout = setTimeout(() => {
      this.isExpanded = false;
      this.cdr.markForCheck();
    }, 200);
  }

  logout() {
    this.authService.logout();
  }
}
