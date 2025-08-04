import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './Services/auth-service';
import { Sidebar } from './Components/sidebar/sidebar';
import { RouterOutlet } from '@angular/router';
import { ChatBot } from "./Components/chat-bot/chat-bot";
import { UpdateProfile } from './Components/update-profile/update-profile';
import { SystemSettings } from './Components/system-settings/system-settings';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-root',
  imports: [Sidebar, RouterOutlet, ChatBot, UpdateProfile, SystemSettings],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected title = 'HRMS';
  public authReady = false;
  isLoggedIn: boolean = false;
  showUpdateProfileModal = false;
  showSystemSettingsModal = false;

  constructor(public router: Router, private authService: AuthService) {
    
  }

  ngOnInit(): void {
    // Check initial authentication state
    this.isLoggedIn = this.authService.authenticated();
    this.authReady = true;
    
    // Subscribe to authentication changes
    this.authService.userData.subscribe({
      next: () => {
        this.isLoggedIn = this.authService.authenticated();
      }
    })
  }

  openUpdateProfileModal() {
    this.showUpdateProfileModal = true;
  }
  closeUpdateProfileModal() {
    this.showUpdateProfileModal = false;
  }

  openSystemSettingsModal() {
    this.showSystemSettingsModal = true;
  }
  closeSystemSettingsModal() {
    this.showSystemSettingsModal = false;
  }
}
