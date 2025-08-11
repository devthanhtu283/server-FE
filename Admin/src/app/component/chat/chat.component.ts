import { AfterViewChecked, ChangeDetectorRef, Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BaseUrl } from 'src/app/service/baseUrl.service';
import { UserService } from 'src/app/service/user.service';
import { WebSocketService } from 'src/app/service/webSocket.service';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  user: any;
  receivers: any[] = [];
  imgBaseUrl: string;
  selectedReceiver: any = {};
  newMessage: string = '';
  private shouldScroll: boolean = false; // Biến để kiểm tra xem có nên cuộn hay không

  @ViewChild('chatContent') chatContent!: ElementRef;

  constructor(
    private userService: UserService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private baseUrl: BaseUrl,
    private webSocketService: WebSocketService
  ) {
    this.imgBaseUrl = this.baseUrl.getUserImageUrl();
  }

  ngOnInit(): void {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user || !user.id) {
      this.router.navigate(['/']);
      return;
    }

    this.user = user;
    console.log('Current user:', this.user);

    // Kết nối WebSocket
    this.webSocketService.connect();

    // Đăng ký nhận tin nhắn từ WebSocket
    this.webSocketService.getMessages().subscribe(
      (message: any) => {
        if (message) {
          const receiver = this.receivers.find(
            r =>
              (r.data.id === message.senderId && message.receiverId === this.user.id) ||
              (r.data.id === message.receiverId && message.senderId === this.user.id)
          );

          if (receiver) {
            const isDuplicate = receiver.chats.some((msg: any) => msg.id === message.id);
            if (!isDuplicate) {
              receiver.chats.push(message);
              receiver.chats.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

              if (this.selectedReceiver?.data?.id === receiver.data.id) {
                this.selectedReceiver = receiver;
                this.shouldScroll = true; // Đánh dấu cần cuộn
                this.cdr.markForCheck();
                this.cdr.detectChanges();
              }
            }
          }
        }
      },
      (error) => console.error('WebSocket error:', error)
    );

    // Lấy danh sách người nhận
    this.userService.getReceiverIdsByUserId(this.user.id).then(
      (res: any[]) => {
        console.log('Receiver IDs:', res);

        const userPromises = res.map(async id => {
          try {
            let user = await this.userService.findByIdEmployer(id);
            if (!user || !user.status || !user.data) {
              user = await this.userService.findByIdSeeker(id);
            }
            if (!user || !user.status || !user.data) {
              return null;
            }
            return { ...user, chats: [] };
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
              this.userService.getMessagesBetweenUsers(this.user.id, receiver.data.id).then(
                (messages: any[]) => {
                  receiver.chats = messages;
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
                this.shouldScroll = true; // Đánh dấu cần cuộn khi khởi tạo
                this.cdr.markForCheck();
                this.cdr.detectChanges();
              }
            });
          },
          (error) => console.error('Error fetching users:', error)
        );
      },
      (error) => console.error('Error fetching receiver IDs:', error)
    );
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false; // Reset biến sau khi cuộn
    }
  }

  ngOnDestroy(): void {
    this.webSocketService.disconnect();
  }

  chooseReceiver(receiver: any): void {
    this.selectedReceiver = receiver;
    this.shouldScroll = true; // Đánh dấu cần cuộn khi chọn người nhận
    this.cdr.markForCheck();
    this.cdr.detectChanges();
  }

  sendMessage(): void {
    if (this.newMessage.trim() && this.selectedReceiver?.data?.id) {
      const message = {
        senderId: this.user.id,
        receiverId: this.selectedReceiver.data.id,
        senderRole: 'SEEKER',
        receiverRole: 'EMPLOYER',
        message: this.newMessage,
        time: new Date(),
        status: true
      };

      console.log('Sending message:', message);
      this.webSocketService.sendMessage(message);
      this.newMessage = '';
      this.shouldScroll = true; // Đánh dấu cần cuộn khi gửi tin nhắn
      this.cdr.markForCheck();
      this.cdr.detectChanges();
    } else {
      console.warn('Cannot send message: invalid input or receiver');
    }
  }

  scrollToBottom(): void {
    if (this.chatContent?.nativeElement) {
      const el = this.chatContent.nativeElement;
      el.scrollTop = el.scrollHeight;
      console.log('Scroll height:', el.scrollHeight, 'Scroll top:', el.scrollTop);
    } else {
      console.warn('chatContent is not available');
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
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${hours}:${minutes}:${seconds} - ${day}/${month}/${year}`;
  }
}