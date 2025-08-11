import { DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { distinctUntilChanged, interval, switchMap } from 'rxjs';
import { Notification } from 'src/app/models/notification.model';
import { CreateUser, User } from 'src/app/models/user.model';
import { ChatService } from 'src/app/services/chatBot.service';
import { NotificationService } from 'src/app/services/notification.service';
import { UserService } from 'src/app/services/user.service';
declare const google: any;

@Component({
  selector: 'seeker-root',
  templateUrl: './seeker.root.html',
  styleUrls: ['./seeker.root.css'],
  providers: [DatePipe] // Đảm bảo DatePipe được thêm vào providers
})
export class SeekerRoot implements OnInit {
  chatMessages: { text: string; isUser: boolean }[] = [];
  chatInput: string = '';
  isTyping: boolean = false;
  title = 'job_user';
  currentForm: string = 'candidate';
  registerCandidateForm: FormGroup;
  registerEmployerForm: FormGroup;
  checkEmailForm: FormGroup;
  loginForm: FormGroup;
  newCandidate: CreateUser;
  candidate: User;
  newEmployer: CreateUser;
  employer: User;
  user: User;
  randomNumber = Math.floor(100000 + Math.random() * 900000);
  showForgotModal = true;
  showResetPasswordModal = false;
  hasProPlan: boolean = false;
  userMembership: any = null;
  private hasCheckedReminder = false;
  selectedUserType: number = 1; // 1 = seeker, 2 = employer

  notifications: Notification[] = [];
  groupedNotifications: { [key: string]: Notification[] } = {};
  unreadCount: number = 0;
  userId: number;
  private previousUnreadCount = 0;
  constructor(
    private formBuilder: FormBuilder,
    private messageService: MessageService,
    private datePipe: DatePipe,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private userService: UserService,
    private chatService: ChatService,
    private notificationService: NotificationService
  ) {
    this.registerCandidateForm = this.formBuilder.group({
      candidateName: ['', [Validators.required]],
      candidateEmail: ['', [Validators.required, Validators.email]],
      candidatePassword: ['', [Validators.required]],
      candidateConfirmPassword: ['', [Validators.required]]
    });
    this.registerEmployerForm = this.formBuilder.group({
      employerName: ['', [Validators.required]],
      employerEmail: ['', [Validators.required, Validators.email]],
      employerPassword: ['', [Validators.required]],
      employerConfirmPassword: ['', [Validators.required]]
    });
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
    this.checkEmailForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  ngOnInit(): void {
    this.showForm(this.currentForm);



    this.login();
    const userData = localStorage.getItem('user');
    if (userData) {
      this.user = JSON.parse(userData);
      this.userId = this.user.id;
    }
    this.chatMessages.push({
      text: 'Xin chào, đây là AI Chatbot thông minh, xin hãy nhập câu hỏi',
      isUser: false,
    });

    // Kiểm tra userMembership và endDate
    if (this.user && this.user.id) {
      this.userService.findEmployerMembershipByUserId(this.user.id).then(
        (res) => {
          this.userMembership = res;
          if (this.userMembership && this.userMembership.membershipId && this.userMembership.status) {
            this.hasProPlan = true;
            // Kiểm tra ngày hết hạn
            this.checkMembershipExpiration();
          }
          this.cdr.detectChanges();
        },
        (error) => {
         
        }
      );
    }
    this.notificationService.connect(this.userId);

    this.notificationService.getNotifications(this.userId).subscribe(notifications => {
      this.notifications = this.mapNotifications(notifications);
      this.groupNotifications();
    });

    this.notificationService.notifications$.subscribe(newNotification => {
      console.log('Received notification via socket:', newNotification);
      if (Array.isArray(newNotification)) {
        console.log('Received notification types:', newNotification.map(n => n.type));
      }
      const mapped = this.mapNotifications(newNotification);
      this.notifications = [...mapped, ...this.notifications];
      this.updateUnreadCount(); // Cập nhật unreadCount khi polling
        this.cdr.markForCheck(); // Force change detection
        this.groupNotifications();
    });

    this.notificationService.unreadCount$.subscribe(count => {
      this.unreadCount = count;
    });

    this.notificationService.updateUnreadCount(this.userId);

  //   interval(5000) // mỗi 5 giây
  // .pipe(
  //   switchMap(() => this.notificationService.getUnreadNotifications(this.userId))
  // )
  // .subscribe((newNotifications) => {
  //   // Chỉ thêm thông báo mới
  //   console.log('API Response:', newNotifications);
  //   const existingIds = this.notifications.map((n) => n.id); // Lấy danh sách ID hiện tại
  //   const uniqueNotifications = newNotifications.filter((n) => !existingIds.includes(n.id)); // Lọc thông báo mới
  //   this.notifications = [...uniqueNotifications, ...this.notifications]; // Thêm thông báo mới vào đầu danh sách
  //   console.log('Updated notifications:', this.notifications);
  // });
  // Polling thông minh với debounce và unsubscribe khi destroy
  const pollInterval = interval(10000)
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


    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      google.accounts.id.initialize({
        client_id: '154715425720-a22pc63jahbgsq5pnqs05rr9a4sa7q3e.apps.googleusercontent.com',
        callback: this.handleGoogleCredential.bind(this)
      });

      document.querySelectorAll('.googleBtnContainer').forEach(container => {
        google.accounts.id.renderButton(container, {
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          width: 300
        });
      });
};
document.head.appendChild(script);

  }

  ngOnDestroy() {
    this.notificationService.disconnect();
  }
  handleGoogleCredential(response: any) {
    const idToken = response.credential;

    this.userService.googleLogin({ idToken, userType: this.selectedUserType }).subscribe(
      async (user: any) => {
        console.log(user);

        if (user.user.userType === 1) {
          const candidateInfo: any = await this.userService.findByEmail(user.user.email);
      
          localStorage.setItem('candidate', JSON.stringify(candidateInfo));
          localStorage.setItem('user', JSON.stringify(candidateInfo.data));
          localStorage.setItem('token', user.jwt);
          window.location.href = '/seeker/home';
        } else if (user.user.userType === 2) {
          const employerInfo: any = await this.userService.findByEmail(user.user.email);
          console.log(employerInfo);
          localStorage.setItem('token', user.jwt);
          localStorage.setItem('user', JSON.stringify(employerInfo.data));
          localStorage.setItem('employer', JSON.stringify(employerInfo));

          window.location.href = '/employer/dashboard';
        }
      }
    );

  }

  updateUnreadCount() {
    const prevCount = this.unreadCount;
    this.unreadCount = this.notifications.filter(n => !n.read).length;
    this.cdr.markForCheck(); // Force change detection
  }

  mapNotifications(notifications: Notification[] | Notification | any): Notification[] {
    if (!Array.isArray(notifications)) {
      notifications = [notifications]; // ép thành mảng
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


  async checkMembershipExpiration(): Promise<void> {
    console.trace('📍 checkMembershipExpiration() được gọi từ đây');

    if (this.hasCheckedReminder) return; // Ngăn gọi lặp
    this.hasCheckedReminder = true;

    if (!this.userMembership || !this.userMembership.endDate) {
      console.warn('⚠️ Không có thông tin userMembership hoặc endDate');
      return;
    }

    const endDate = new Date(this.userMembership.endDate);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = diffTime / (1000 * 3600 * 24);
    const alreadyReminded = sessionStorage.getItem('membershipReminderSent');
    console.log('🕓 Số ngày còn lại của gói:', diffDays);
    console.log('🔁 Đã gửi nhắc trước chưa:', this.userMembership.reminderSent);
    console.log(alreadyReminded);
    // 📧 Gửi nhắc nhở nếu còn ~3 ngày và chưa gửi trước đó
    if (diffDays > 2.5 && diffDays <= 3.5 && !this.userMembership.reminderSent && !alreadyReminded) {

      const emailContent = `<html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
          .header { text-align: center; padding: 20px; background-color: #007bff; color: #fff; }
          .header h1 { margin: 0; font-size: 24px; }
          .content { padding: 20px; background-color: #fff; border-radius: 5px; }
          .cta-button { display: inline-block; padding: 10px 20px; background-color: #007bff; color: #fff; text-decoration: none; border-radius: 5px; }
          .cta-button:hover { background-color: #0056b3; }
          .footer { text-align: center; padding: 10px; font-size: 12px; color: #777; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Nhắc Nhở Gia Hạn Gói Cước</h1>
          </div>
          <div class="content">
            <p>Kính gửi ${this.user.username},</p>
            <p>Chúng tôi xin thông báo rằng gói cước của bạn sẽ hết hạn vào ngày <strong>${this.datePipe.transform(endDate, 'dd/MM/yyyy')}</strong>.</p>
            <p>Để tiếp tục sử dụng các tính năng cao cấp, vui lòng gia hạn hoặc mua gói cước mới trước khi gói hiện tại hết hạn.</p>
            <p style="text-align: center;">
              <a href="http://103.153.68.231:4200/seeker/plan" class="cta-button" style="color: white;">Gia Hạn Ngay</a>
            </p>
            <p>Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với đội ngũ hỗ trợ của chúng tôi qua email <a href="mailto:support@yourcompany.com">support@yourcompany.com</a>.</p>
            <p>Trân trọng,<br>Đội ngũ Job User</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 Job User. Tất cả quyền được bảo lưu.</p>
          </div>
        </div>
      </body>
    </html>`;

      const email = {
        from: 'truongvanhuong221196@gmail.com',
        to: this.user.email, // Hoặc this.user.username nếu đó là email
        subject: 'Nhắc Nhở: Gói Cước Của Bạn Sắp Hết Hạn',
        content: emailContent,
      };

      try {
        await this.userService.sendEmailTest(email);
        console.log('✅ Email nhắc nhở đã được gửi.');

        // Gửi xong thì cập nhật reminderSent lên server
        const updatedMembership = { ...this.userMembership, reminderSent: true };
        this.userMembership.reminderSent = true;
        sessionStorage.setItem('membershipReminderSent', 'true');
        this.messageService.add({
          severity: 'info',
          summary: 'Thông báo',
          detail: 'Một email nhắc nhở về việc gia hạn gói cước đã được gửi đến bạn.',
        });
      } catch (error) {
        console.error('❌ Gửi email nhắc nhở thất bại:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không thể gửi email nhắc nhở. Vui lòng kiểm tra lại.',
        });
      }
    }

    // ⛔ Gói đã hết hạn
    if (diffDays <= 0 && this.userMembership.status) {
      try {
        const updatedMembership = { ...this.userMembership, status: false };
        await this.userService.updateEmployerMembership(updatedMembership);
        this.userMembership.status = false;
        this.hasProPlan = false;
        this.cdr.detectChanges();

        this.messageService.add({
          severity: 'warn',
          summary: 'Gói cước hết hạn',
          detail: 'Gói cước của bạn đã hết hạn. Vui lòng gia hạn hoặc mua gói mới.',
        });
      } catch (error) {
        console.error('❌ Cập nhật trạng thái userMembership thất bại:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không thể cập nhật trạng thái gói cước. Vui lòng thử lại.',
        });
      }
    }
  }


  async clearData(): Promise<void> {
    localStorage.removeItem('user');
    localStorage.removeItem('candidate');
    localStorage.removeItem('employer');
    localStorage.removeItem('token');
    this.user = null;
    this.cdr.detectChanges();
    await this.router.navigate(['/']);
  }

  async sendMessage(): Promise<void> {
    if (!this.chatInput || this.chatInput.trim() === '') {
      console.error('Tin nhắn không được để trống');
      return;
    }

    this.chatMessages.push({ text: this.chatInput, isUser: true });
    const chatInput1 = this.chatInput;
    this.chatInput = '';
    this.isTyping = true;

    try {
      const response = await this.chatService.sendMessage(chatInput1, 'acc1').toPromise();
      this.chatMessages.push({ text: response.message, isUser: false });
    } catch (error) {
      console.error('Error sending message:', error);
      this.chatMessages.push({
        text: 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau.',
        isUser: false,
      });
    } finally {
      this.isTyping = false;
    }
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.sendMessage();
    }
  }

  registerCandidate() {
    if (
      this.registerCandidateForm.value.candidatePassword !==
      this.registerCandidateForm.value.candidateConfirmPassword
    ) {
      this.messageService.add({
        severity: 'error',
        summary: 'Xác nhận lại mật khẩu',
        detail: 'Mật khẩu xác nhận không trùng với mật khẩu bạn tạo. Vui lòng nhập lại',
      });
      return;
    }

    if (!this.registerCandidateForm.valid) {
      this.messageService.add({
        severity: 'error',
        summary: 'Đăng kí thất bại',
        detail: 'Vui lòng điền đầy đủ thông tin.',
      });
      return;
    }

    this.newCandidate = {
      username: this.registerCandidateForm.value.candidateName,
      email: this.registerCandidateForm.value.candidateEmail,
      password: this.registerCandidateForm.value.candidatePassword,
      userType: 1,
      created: this.datePipe.transform(new Date(), 'dd/MM/yyyy'),
      securityCode: this.randomNumber.toString(),
      status: 0,
    };

    this.userService.register(this.newCandidate).then(
      (res) => {
        if (res) {
          this.messageService.add({
            severity: 'success',
            summary: 'Gửi xác nhận về mail',
            detail: 'Bạn đã tạo tài khoản thành công. Sẽ có 1 email để bạn xác thực tài khoản.',
          });
          this.userService.findByEmail(this.newCandidate.email).then((response: any) => {
            this.candidate = response['data'];
            if (this.candidate) {
              const emailContent = `
                <p>Chào bạn,</p>
                <p>Cảm ơn bạn đã đăng ký tài khoản. Vui lòng nhấp vào liên kết dưới đây để xác nhận tài khoản của bạn:</p>
                <a href='http://103.153.68.231:4200/seeker/verify-account?email=${encodeURIComponent(
                  this.candidate.email
                )}&securityCode=${this.candidate.securityCode}'>Xác nhận tài khoản</a>
              `;
              const email = {
                from: 'truongvanhuong221196@gmail.com',
                to: this.candidate.email,
                subject: 'Xác thực tài khoản',
                content: emailContent,
              };
              this.userService.sendEmail(email).then(
                (res) => console.log(res),
                (err) => console.log('Gửi mail không thành công')
              );
            }
          });
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Thất bại',
            detail: 'Đăng kí thất bại',
          });
        }
      },
      (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Thất bại',
          detail: 'Đăng kí thất bại',
        });
      }
    );
  }

  registerEmployer() {
    if (
      this.registerEmployerForm.value.employerPassword !==
      this.registerEmployerForm.value.employerConfirmPassword
    ) {
      this.messageService.add({
        severity: 'error',
        summary: 'Xác nhận lại mật khẩu',
        detail: 'Mật khẩu xác nhận không trùng với mật khẩu bạn tạo. Vui lòng nhập lại',
      });
      return;
    }

    if (!this.registerEmployerForm.valid) {
      this.messageService.add({
        severity: 'error',
        summary: 'Đăng kí thất bại',
        detail: 'Vui lòng điền đầy đủ thông tin.',
      });
      return;
    }

    this.newEmployer = {
      username: this.registerEmployerForm.value.employerName,
      email: this.registerEmployerForm.value.employerEmail,
      password: this.registerEmployerForm.value.employerPassword,
      userType: 2,
      created: this.datePipe.transform(new Date(), 'dd/MM/yyyy'),
      securityCode: this.randomNumber.toString(),
      status: 0,
    };

    this.userService.register(this.newEmployer).then(
      (res) => {
        if (res) {
          this.messageService.add({
            severity: 'success',
            summary: 'Gửi xác nhận về mail',
            detail: 'Bạn đã tạo tài khoản thành công. Sẽ có 1 email để bạn xác thực tài khoản.',
          });
          this.userService.findByEmail(this.newEmployer.email).then((response: any) => {
            this.employer = response['data'];
            if (this.employer) {
              localStorage.setItem('user', JSON.stringify(this.employer));
              localStorage.setItem(
                'employer',
                JSON.stringify(this.userService.findByIdEmployer(this.employer.id))
              );
              const emailContent = `
                <p>Chào bạn,</p>
                <p>Cảm ơn bạn đã đăng ký tài khoản. Vui lòng nhấp vào liên kết dưới đây để xác nhận tài khoản của bạn:</p>
                <a href='http://103.153.68.231:4200/employer/verify-account?email=${encodeURIComponent(
                  this.employer.email
                )}&securityCode=${this.employer.securityCode}'>Xác nhận tài khoản</a>
              `;
              const email = {
                from: 'truongvanhuong221196@gmail.com',
                to: this.employer.email,
                subject: 'Xác thực tài khoản',
                content: emailContent,
              };
              this.userService.sendEmail(email).then(
                (res) => console.log(res),
                (err) => console.log('Gửi mail không thành công')
              );
            }
          });
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Thất bại',
            detail: 'Đăng kí thất bại',
          });
        }
      },
      (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Thất bại',
          detail: 'Đăng kí thất bại',
        });
      }
    );
  }

  async login() {
    if (!this.loginForm.valid) {

      return;
    }
    const user = {
      email: this.loginForm.value.email,
      password: this.loginForm.value.password,
    };

    try {
      const loginResponse = await this.userService.login(user);
      if (loginResponse.status === true) {
        if (loginResponse["data"]["jwt"]) {
          localStorage.setItem('token', loginResponse["data"]["jwt"]);
          console.log('Token saved:', loginResponse["data"]["jwt"]);
        } else {
          console.warn('No token in login response');
        }
        const userInfo = await this.userService.findByEmail(this.loginForm.value.email);
        this.messageService.add({
          severity: 'success',
          summary: 'Đăng nhập thành công',
          detail: 'Bạn đã đăng nhập vào hệ thống thành công.',
        });

        localStorage.setItem('user', JSON.stringify(userInfo['data']));
        console.log(userInfo['data']);
        if (userInfo['data'].userType === 1) {
          const candidateInfo = await this.userService.findById(userInfo['data'].id);
          localStorage.setItem('candidate', JSON.stringify(candidateInfo));
          setTimeout(() => {
            window.location.href = '/seeker/home';
          }, 1000);
        } else if (userInfo['data'].userType === 2) {
          const employerInfo = await this.userService.findById(userInfo['data'].id);
          localStorage.setItem('employer', JSON.stringify(employerInfo));
          setTimeout(() => {
            window.location.href = '/employer/dashboard';
          }, 1000);
        }
      } else {
        this.messageService.add({
          severity: 'error',
          summary: 'Đăng nhập thất bại',
          detail: 'Thông tin đăng nhập không chính xác.',
        });
      }
    } catch (error) {
      console.error(error);
      this.messageService.add({
        severity: 'error',
        summary: 'Lỗi kết nối',
        detail: 'Đã xảy ra lỗi khi kết nối tới máy chủ. Vui lòng thử lại sau.',
      });
    }
  }

  showForm(form: string) {
    this.currentForm = form;
    this.selectedUserType = form === 'candidate' ? 1 : 2;
  }

}