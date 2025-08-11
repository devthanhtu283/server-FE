import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { User } from 'src/app/models/user.model';
import { UserService } from 'src/app/service/user.service';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { ConfirmationService, MessageService } from 'primeng/api';
import { BaseUrl } from 'src/app/service/baseUrl.service';
import { HttpClient } from '@angular/common/http';
import { WebSocketService } from 'src/app/service/webSocket.service';

@Component({
  templateUrl: './account.component.html',
  styleUrls: ['./accout.component.css'],
})
export class AccountComponent implements OnInit, OnDestroy {
  users: User[] = [];
  searchQuery = '';
  searchSubject = new Subject<string>();
  selectedUserType: number | null = null;
  pageSize = 10;
  currentPage = 1;
  totalPages = 1;
  totalItems = 0;
  pageInfo = '';
  logoPreview: string | null = null;
  imageUrl: string | null = null;

  // Biến cho dialog nhắn tin
  displayMessageDialog: boolean = false;
  selectedUser: User | null = null;
  messageContent: string = '';
  currentUser: any; // Thông tin người dùng hiện tại (admin)

  constructor(
    private userService: UserService,
    private router: Router,
    private confirmationService: ConfirmationService,
    private baseUrl: BaseUrl,
    private http: HttpClient,
    private messageService: MessageService,
    private webSocketService: WebSocketService
  ) {}

  ngOnInit() {
    // Lấy thông tin người dùng hiện tại (admin) từ localStorage
    this.currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (!this.currentUser || !this.currentUser.id) {
      this.router.navigate(['/']);
      return;
    }

    // Kết nối WebSocket
    this.webSocketService.connect();

    this.setupSearch();
    this.fetchUsers();
  }

  ngOnDestroy() {
    // Ngắt kết nối WebSocket khi component bị hủy
    this.webSocketService.disconnect();
  }

  setupSearch() {
    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        this.currentPage = 1;
        this.fetchUsers();
      });
  }

  onSearch() {
    this.searchSubject.next(this.searchQuery);
  }

  filterUserType(userType: number | null) {
    this.selectedUserType = userType;
    this.currentPage = 1;
    this.fetchUsers();
  }

  onPageSizeChange() {
    this.currentPage = 1;
    this.fetchUsers();
  }

  onPageChange(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.fetchUsers();
    }
  }

  editUser(id: number, status: number, username: string) {
    const newStatus = status === 1 ? 0 : 1;
    const actionText = newStatus === 1 ? 'kích hoạt' : 'vô hiệu hóa';
    this.confirmationService.confirm({
      message: `Bạn có chắc muốn ${actionText} tài khoản <strong>${username}</strong>??`,
      header: 'Xác nhận thay đổi trạng thái',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Duyệt',
      rejectLabel: 'Hủy',
      acceptButtonStyleClass: 'p-button-success',
      rejectButtonStyleClass: 'p-button-danger',
      accept: async () => {
        try {
          const response = await this.userService.findById(id);
          const user = response.data;
          user.status = newStatus;
          await this.userService.update(user);
          this.messageService.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Cập nhật trạng thái người dùng thành công.'
          });
          this.fetchUsers();
        } catch (error) {
          console.error('Error updating status:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Thất bại',
            detail: 'Cập nhật trạng thái người dùng thất bại.'
          });
        }
      }
    });
  }

  fetchUsers() {
    const params: any = {
      page: this.currentPage - 1,
      size: this.pageSize,
    };

    if (this.selectedUserType) {
      params.userType = this.selectedUserType;
    }

    if (this.searchQuery) {
      params.search = this.searchQuery;
    }

    this.userService
      .findAll(
        this.currentPage - 1,
        this.pageSize,
        params.userType,
        params.search
      )
      .then((response) => {
        this.users = response['data']['content'];
        this.totalItems = response['data']['totalElements'];
        this.totalPages = response['data']['totalPages'];
        this.updatePageInfo();
      })
      .catch((err) => {
        console.error('❌ Fetch user failed:', err);
      });
  }

  updatePageInfo() {
    const start = (this.currentPage - 1) * this.pageSize + 1;
    const end = Math.min(this.currentPage * this.pageSize, this.totalItems);
    this.pageInfo = `${start}–${end} của ${this.totalItems}`;
  }

  loadImage() {
    this.http.get(this.logoPreview!, {
      responseType: 'blob'
    }).subscribe(blob => {
      const objectURL = URL.createObjectURL(blob);
      this.imageUrl = objectURL;
    }, error => {
      console.error('Image load failed:', error);
    });
  }

  // Mở dialog nhắn tin
  openMessageDialog(user: User) {
    this.selectedUser = user;
    this.messageContent = '';
    this.displayMessageDialog = true;
  }

  // Đóng dialog nhắn tin
  closeMessageDialog(event?: Event) {
    if (event) {
      event.stopPropagation(); // Ngăn chặn sự kiện click trên overlay lan ra ngoài
    }
    this.displayMessageDialog = false;
    this.selectedUser = null;
    this.messageContent = '';
  }

  // Ngăn chặn sự kiện click lan ra ngoài dialog
  stopPropagation(event: Event) {
    event.stopPropagation();
  }

  // Gửi tin nhắn
  sendMessage() {
    if (!this.messageContent.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cảnh báo',
        detail: 'Vui lòng nhập nội dung tin nhắn.'
      });
      return;
    }

    if (!this.selectedUser || !this.currentUser) {
      this.messageService.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không xác định được người gửi hoặc người nhận.'
      });
      return;
    }

    const message = {
      senderId: this.currentUser.id,
      receiverId: this.selectedUser.id,
      senderRole: 'ADMIN', // Giả định người gửi là admin
      receiverRole: this.selectedUser.userType === 1 ? 'SEEKER' : 'EMPLOYER',
      message: this.messageContent,
      time: new Date(),
      status: true
    };

    try {
      this.webSocketService.sendMessage(message);
      this.messageService.add({
        severity: 'success',
        summary: 'Thành công',
        detail: `Tin nhắn đã được gửi đến ${this.selectedUser.username}.`
      });
      this.closeMessageDialog();
    } catch (error) {
      console.error('Error sending message:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Gửi tin nhắn thất bại.'
      });
    }
  }
}