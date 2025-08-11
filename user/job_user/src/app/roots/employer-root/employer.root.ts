import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { distinctUntilChanged, interval, switchMap } from 'rxjs';
import { Notification } from 'src/app/models/notification.model';
import { User } from 'src/app/models/user.model';
import { ChatService } from 'src/app/services/chatBot.service';
import { NotificationService } from 'src/app/services/notification.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'employer-root',
  templateUrl: './employer.root.html',
  styleUrls: ['./employer.root.css'],
})
export class EmployerRoot implements OnInit {
  user: User | null = null;
  chatMessages: { text: string; isUser: boolean }[] = []; // Mảng lưu trữ tin nhắn
  chatInput: string = ''; // Biến lưu trữ tin nhắn nhập từ người dùng
  isTyping: boolean = false; // Biến kiểm soát trạng thái "Đang nhập..."
  title = 'job_user';
  notifications: Notification[] = [];
  groupedNotifications: { [key: string]: Notification[] } = {};
  unreadCount: number = 0;
  userId: number;

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef,
    private userService: UserService,
    private chatService: ChatService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    // Lấy user từ localStorage và gán vào biến `user`
    const userData = localStorage.getItem('user');
    if (userData) {
      this.user = JSON.parse(userData);
      this.userId = this.user.id;
    }
    this.chatMessages.push({
      text: 'Xin chào, đây là AI Chatbot thông minh, xin hãy nhập câu hỏi',
      isUser: false,
    });
    this.notificationService.connect(this.userId);
    console.log(this.userId);
    this.notificationService
      .getNotifications(this.userId)
      .subscribe((notifications) => {
        this.notifications = this.mapNotifications(notifications);
        this.groupNotifications();
      });

    this.notificationService.notifications$.subscribe((newNotification) => {
      console.log('Received notification via socket:', newNotification);
      if (Array.isArray(newNotification)) {
        console.log(
          'Received notification types:',
          newNotification.map((n) => n.type)
        );
      }
      const mapped = this.mapNotifications(newNotification);
      this.notifications = [...mapped, ...this.notifications];
      this.updateUnreadCount(); // Cập nhật unreadCount khi polling
        this.cdr.markForCheck(); // Force change detection
        this.groupNotifications();
    });

    this.notificationService.unreadCount$.subscribe((count) => {
      this.unreadCount = count;
    });

    this.notificationService.updateUnreadCount(this.userId);

    const pollInterval = interval(10000) // Emits values at a 10-second interval
        .pipe(
          distinctUntilChanged(),
          switchMap(() => this.notificationService.getUnreadNotifications(this.userId))
        )
        .subscribe((newNotifications) => {
          const existingIds = new Array(...this.notifications.map((n) => n.id));
          const uniqueNotifications = newNotifications.filter((n) => !existingIds.includes(n.id));
          if (uniqueNotifications.length > 0) {
            this.notifications = [...uniqueNotifications, ...this.notifications];
            this.updateUnreadCount(); // Cập nhật unreadCount khi polling
            this.cdr.markForCheck(); // Force change detection
            this.groupNotifications();
          }
        });
    
        this.ngOnDestroy = () => {
          pollInterval.unsubscribe();
          this.notificationService.disconnect();
        };

  }

  ngOnDestroy() {
    this.notificationService.disconnect();
  }

  updateUnreadCount() {
    const prevCount = this.unreadCount;
    this.unreadCount = this.notifications.filter(n => !n.read).length;
    this.cdr.markForCheck(); // Force change detection
  }


  mapNotifications(notifications: Notification[] | Notification | any): Notification[] {
    if (!Array.isArray(notifications)) {
      notifications = [notifications];
    }

    return notifications.map((notification: Notification) => {
      let icon = '';
      switch (notification.type) {
        case 'JOB_CREATED':
          icon = 'assets/img/icon/google.svg';
          break;
        case 'APPLICATION_SUBMITTED':
          icon = 'assets/img/icon/microsoft.svg';
          break;
        default:
          icon = 'assets/img/icon/upwork.svg';
      }
      return { ...notification, icon };
    });
  }


  // Nhóm thông báo theo ngày
  groupNotifications() {
    const vietnameseMonths = [
      'Tháng Một', 'Tháng Hai', 'Tháng Ba', 'Tháng Tư', 'Tháng Năm', 'Tháng Sáu',
      'Tháng Bảy', 'Tháng Tám', 'Tháng Chín', 'Tháng Mười', 'Tháng Mười Một', 'Tháng Mười Hai'
    ];

    this.groupedNotifications = this.notifications.reduce((groups, notification) => {
      const date = new Date(notification.createdAt);
      const localDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
      const today = new Date();
      let groupKey: string;

      if (date.toDateString() === today.toDateString()) {
        groupKey = 'Hôm nay';
      } else {
        const day = localDate.getDate().toString().padStart(2, '0'); // Lấy ngày, định dạng 2 chữ số
        const monthIndex = localDate.getMonth(); // Lấy tháng (0-11)
        groupKey = `${day} ${vietnameseMonths[monthIndex]}`; // Định dạng "03 Tháng Sáu"
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(notification);
      console.log(groups);
      return groups;
    }, {} as { [key: string]: Notification[] });
    console.log('Notifications:', this.notifications);

  }
  // Tính thời gian tương đối
  getRelativeTime(createdAt: string): string {
    const date = new Date(createdAt);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 60) {
      return `${diffInMinutes} Minutes ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} Hours ago`;
    } else {
      return `${diffInDays} Days ago`;
    }
  }

  compareByCustomKeyOrder = (a: any, b: any): number => {
    if (a.key === 'Hôm nay') return -1;
    if (b.key === 'Hôm nay') return 1;

    // Chuyển "03 Tháng Sáu" thành dạng Date để so sánh
    const parseVietnameseDate = (str: string): Date => {
      const [day, monthName] = str.split(' ');
      const months = [
        'Tháng Một', 'Tháng Hai', 'Tháng Ba', 'Tháng Tư', 'Tháng Năm', 'Tháng Sáu',
        'Tháng Bảy', 'Tháng Tám', 'Tháng Chín', 'Tháng Mười', 'Tháng Mười Một', 'Tháng Mười Hai'
      ];
      const monthIndex = months.indexOf(monthName);
      const year = new Date().getFullYear();
      return new Date(year, monthIndex, parseInt(day, 10));
    };

    const dateA = parseVietnameseDate(a.key);
    const dateB = parseVietnameseDate(b.key);

    return dateB.getTime() - dateA.getTime(); // Mới hơn lên trước
  };


  markAsRead(notification: Notification) {
    if (!notification.read) {
      this.notificationService.markAsRead(notification.id).subscribe(() => {
        notification.read = true;
        this.notificationService.updateUnreadCount(this.userId);
        this.loadNotifications(); // Tải lại thông báo sau khi đánh dấu là đã đọc
        this.cdr.markForCheck(); // Force change detection

        if (notification.type?.toUpperCase() === 'CHAT_MESSAGE') {
          this.router.navigate(['/seeker/message']);
        } else if (notification.jobId) {
          this.router.navigate(['/seeker/job-details', notification.jobId]);
        }
      });
    } else {
      if (notification.type?.toUpperCase() === 'CHAT_MESSAGE') {
        this.router.navigate(['/seeker/message']);
      } else if (notification.jobId) {
        this.router.navigate(['/seeker/job-details', notification.jobId]);
      }
    }
  }

  loadNotifications() {
    this.notificationService.getNotifications(this.userId).subscribe(notifications => {
      this.notifications = notifications;
      this.unreadCount = notifications.filter(n => !n.read).length;
      this.groupNotifications();
      this.cdr.detectChanges();
    });
  }
  markAllAsRead() {
    const userId = this.user.id; // Lấy userId
    this.notificationService.markAsReadAll(userId).subscribe(() => {
    this.loadNotifications(); // Tải lại thông báo sau khi đánh dấu tất cả là đã đọc
    }, error => {
      console.error('Error marking all as read:', error);
    });
  }


  async clearData(): Promise<void> {
    localStorage.removeItem('user');
    localStorage.removeItem('candidate');
    localStorage.removeItem('employer');
    this.user = null;
    this.cdr.detectChanges();
    await this.router.navigate(['/']);
  }

  // Hàm gửi tin nhắn
  async sendMessage(): Promise<void> {
    // Kiểm tra nếu chatInput trống hoặc chỉ chứa khoảng trắng
    if (!this.chatInput || this.chatInput.trim() === '') {
      console.error('Tin nhắn không được để trống');
      return; // Dừng hàm nếu tin nhắn trống
    }

    // Thêm tin nhắn của người dùng vào mảng chatMessages
    this.chatMessages.push({ text: this.chatInput, isUser: true });
    var chatInput1 = this.chatInput;
    this.chatInput = '';

    // Xóa nội dung trong ô nhập tin nhắn

    // Hiển thị trạng thái "Đang nhập..."
    this.isTyping = true;

    try {
      // Gửi tin nhắn đến API và nhận phản hồi
      const response = await this.chatService
        .sendMessage(chatInput1, 'acc1')
        .toPromise();
      this.chatMessages.push({ text: response.message, isUser: false }); // Thêm phản hồi từ bot
    } catch (error) {
      console.error('Error sending message:', error);
      this.chatMessages.push({
        text: 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau.',
        isUser: false,
      });
    } finally {
      // Ẩn trạng thái "Đang nhập..." sau khi nhận được phản hồi hoặc có lỗi
      this.isTyping = false;
    }
  }
  // Hàm xử lý sự kiện nhấn phím Enter
  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.sendMessage();
    }
  }
}
