import { ChangeDetectorRef, Component, ViewChild, ElementRef, AfterViewInit, NgZone } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { ChatBotService } from '../../Services/chat-bot-service';
import { IChatBot } from '../../Interfaces/ichat-bot';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chat-bot',
  templateUrl: './chat-bot.html',
  styleUrls: ['./chat-bot.css'],
  standalone: true,
  imports: [CommonModule, FormsModule],
  animations: [
    trigger('chatWindow', [
      state('minimized', style({
        height: '70px', width: '70px', borderRadius: '50%', bottom: '30px', right: '30px', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' })),
      state('open', style({
        height: '460px', width: '400px', borderRadius: '16px', bottom: '30px', right: '30px', boxShadow: '0 2px 16px rgba(0,0,0,0.3)' })),
      transition('minimized <=> open', [
        animate('300ms cubic-bezier(0.4,0,0.2,1)')
      ]),
    ])
  ]
})
export class ChatBot implements AfterViewInit {
  isOpen = false;
  firstOpen = true;
  messages: IChatBot[] = [];
  userInput = '';
  isTyping = false;
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  constructor(
    private chatBotService: ChatBotService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngAfterViewInit() {
    this.scrollToBottom();
  }

  private scrollToBottom() {
    setTimeout(() => {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
      }
    }, 0);
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
    if (this.isOpen && this.firstOpen) {
      this.firstOpen = false;
      this.getWelcome();
    }
    if (this.isOpen) {
      this.cdr.detectChanges();
      this.scrollToBottom();
    }
  }

  getWelcome() {
    this.isTyping = true;
    this.cdr.detectChanges();
    this.chatBotService.getWelcomeMessage().subscribe(res => {
      this.ngZone.run(() => {
        this.messages.push(res);
        this.isTyping = false;
        this.cdr.detectChanges();
        this.scrollToBottom();
      });
    }, () => {
      this.ngZone.run(() => {
        this.isTyping = false;
        this.cdr.detectChanges();
      });
    });
  }

  sendMessage() {
    const trimmed = this.userInput.trim();
    if (!trimmed) return;
    const userMsg: IChatBot = {
      id: Date.now(),
      sender: 'user',
      message: trimmed,
      timestamp: new Date()
    };
    this.messages.push(userMsg);
    this.userInput = '';
    this.isTyping = true;
    this.cdr.detectChanges();
    this.scrollToBottom();
    this.chatBotService.sendMessage(trimmed).subscribe(res => {
      this.ngZone.run(() => {
        this.messages.push(res);
        this.isTyping = false;
        this.cdr.detectChanges();
        this.scrollToBottom();
      });
    }, () => {
      this.ngZone.run(() => {
        this.isTyping = false;
        this.cdr.detectChanges();
      });
    });
  }

  onInputKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.sendMessage();
    }
  }
}
