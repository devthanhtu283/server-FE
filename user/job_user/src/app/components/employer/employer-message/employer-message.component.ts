import { ChangeDetectorRef, Component, OnInit, OnDestroy, ViewChild, ElementRef } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { User } from 'src/app/models/user.model';
import { UserService } from "src/app/services/user.service";
import { WebSocketService } from "src/app/services/webSocket.service";
import { BaseUrl } from "src/app/services/baseUrl.service";

@Component({
  selector: 'app-employer-message',
  templateUrl: "./employer-message.component.html",
  styleUrls: ["./employer-message.component.css"]
})
export class EmployerMessageComponent implements OnInit, OnDestroy {
  user: User | null = null;
  receivers: any[] = [];
  imgBaseUrl: string;
  selectedReceiver: any = {};
  newMessage: string = '';

  @ViewChild('chatContent') chatContent!: ElementRef; // Tham chiếu đến khu vực tin nhắn

  constructor(
    private userService: UserService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private baseUrl: BaseUrl,
    private webSocketService: WebSocketService
  ) {
    this.imgBaseUrl = this.baseUrl.getJobImageUrl();
  }

  ngOnInit(): void {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user || !user.id) {
      this.router.navigate(['/']);
    } else {
      this.user = user;
      console.log('Current user:', this.user);

      // Kết nối WebSocket
      this.webSocketService.connect();

      // Đăng ký nhận tin nhắn
      this.webSocketService.getMessages().subscribe(
        (message: any) => {
          if (message) {
            const receiver = this.receivers.find(
              r =>
                (r.data.id === message.senderId && message.receiverId === this.user!.id) ||
                (r.data.id === message.receiverId && message.senderId === this.user!.id)
            );

            if (receiver) {
              const isDuplicate = receiver.chats.some((msg: any) => msg.id === message.id);
              if (!isDuplicate) {
                receiver.chats.push(message);
              }

              if (
                this.selectedReceiver &&
                this.selectedReceiver.data &&
                this.selectedReceiver.data.id === receiver.data.id
              ) {
                this.cdr.detectChanges();
                // Cuộn xuống tin nhắn cuối cùng khi nhận tin nhắn từ WebSocket
                setTimeout(() => {
                  this.scrollToBottom();
                }, 100);
              }
            }
          }
        }
      );

      // Lấy danh sách receiver_ids
      this.userService.getReceiverIdsByUserId(this.user.id).then(
        (res: any[]) => {
          console.log('Receiver IDs:', res);
      
          const userPromises = res.map(async (id) => {
            try {
              // Thử tìm theo thứ tự Seeker -> Employer -> Admin
              let user = await this.userService.findByIdSeeker(id);
              if (!user || !user.status || !user.data) {
                user = await this.userService.findByIdEmployer(id);
              }
              if (!user || !user.status || !user.data) {
                user = await this.userService.findById(id); // Admin
              }
              if (!user || !user.status || !user.data) {
                return null;
              }
              return {
                ...user,
                chats: []
              };
            } catch (error) {
              console.error('Error finding user by ID:', id, error);
              return null;
            }
          });
      
          Promise.all(userPromises).then(
            (users: any[]) => {
              this.receivers = users.filter(user => user !== null);
              console.log('Receivers:', this.receivers);
      
              const messagePromises = this.receivers.map(receiver =>
                this.userService.getMessagesBetweenUsers(this.user!.id, receiver.data.id).then(
                  (messages: any[]) => {
                    receiver.chats = messages;
                    console.log(this.receivers);
                  },
                  (error) => {
                    console.error('Error fetching messages for receiver:', receiver.data.id, error);
                    receiver.chats = [];
                  }
                )
              );
      
              Promise.all(messagePromises).then(() => {
                if (this.receivers.length > 0) {
                  this.selectedReceiver = this.receivers[0];
                  this.cdr.detectChanges();
                  this.scrollToBottom(); // Cuộn xuống tin nhắn cuối cùng khi tải lần đầu
                }
              });
              
            },
            (error) => {
              console.error('Error fetching users:', error);
            }
          );
        },
        (error) => {
          console.error('Error fetching receiver IDs:', error);
        }
      );
      
    }
  }

  ngOnDestroy(): void {
    this.webSocketService.disconnect();
  }

  chooseReceiver(receiver: any): void {
    this.selectedReceiver = receiver;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.scrollToBottom();
    }, 100);
  }

  sendMessage(): void {
    if (this.newMessage && this.selectedReceiver && this.selectedReceiver.data && this.selectedReceiver.data.id) {
      const message = {
        senderId: this.user!.id,
        receiverId: this.selectedReceiver.data.id,
        senderRole: 'EMPLOYER',
        receiverRole: 'SEEKER',
        message: this.newMessage,
        time: new Date(),
        status: true
      };

      // Gửi tin nhắn qua WebSocket
      this.webSocketService.sendMessage(message);

      // Reset input
      this.newMessage = '';

      // Không thêm tin nhắn vào chats ngay tại đây, chờ WebSocket trả về
      this.cdr.detectChanges();
    }
  }

  scrollToBottom(): void {
    if (this.chatContent) {
      const chatElement = this.chatContent.nativeElement;
      chatElement.scrollTop = chatElement.scrollHeight; // Cuộn xuống dưới cùng
      console.log('Scrolled to bottom');
    }
  }

  getTimeAgo(time: string): string {
    const messageDate = new Date(time);
    const now = new Date();
    const diffInMs = now.getTime() - messageDate.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    return `${diffInHours} Hour${diffInHours !== 1 ? 's' : ''} ago`;
  }

  formatMessageTime(time: string): string {
    const date = new Date(time);
    return date.toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
  }

}