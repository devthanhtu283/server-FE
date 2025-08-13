import { Component, OnInit } from '@angular/core';
import { UserService } from './services/user.service';
import { ChangeDetectorRef } from '@angular/core';
import { User } from './models/user.model';
import { NavigationEnd, Router } from '@angular/router';
import { ChatService } from './services/chatBot.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  user: User | null = null;
  chatMessages: { text: string, isUser: boolean }[] = []; // Mảng lưu trữ tin nhắn
  chatInput: string = ''; // Biến lưu trữ tin nhắn nhập từ người dùng
  isTyping: boolean = false; // Biến kiểm soát trạng thái "Đang nhập..."
  title = 'job_user';
  showFooter: boolean = false; // Biến kiểm soát hiển thị footer


  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef,
    private userService: UserService,
    private chatService: ChatService // Thêm ChatService vào constructor
  ) {
     // Theo dõi sự kiện thay đổi route
     this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        // Kiểm tra đường dẫn hiện tại
        this.showFooter = this.shouldShowFooter(event.url);
      }
    });
  }

  ngOnInit(): void {
      // Lấy user từ localStorage và gán vào biến `user`
      const userData = localStorage.getItem('user');
      if (userData) {
        this.user = JSON.parse(userData);
      }
      this.chatMessages.push({ text: "Xin chào, đây là AI Chatbot thông minh, xin hãy nhập câu hỏi", isUser: false });
    }
  
    shouldShowFooter(url: string): boolean {
      const routesWithFooter = [
        '/seeker/home',
        '/seeker/contact',
        '/seeker/list-jobs',
        '/seeker/suitable-jobs',
        '/seeker/about',
        '/seeker/faq',
        '/seeker/terms-and-conditions',
        '/seeker/policy',
        '/seeker',
        '/seeker/plan'
      ];

      if (routesWithFooter.includes(url)) {
        return true;
      }

      if (url.startsWith('/seeker/job-details/')) {
        return true;
      }
      // if (url.startsWith('/seeker/')) {
      //   return true;
      // }
      return false;
    }
    

}