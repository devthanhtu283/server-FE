import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private ws: WebSocket;
  private messageSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor() {}

  // Kết nối tới WebSocket
  connect(): void {
    // this.ws = new WebSocket('ws://103.153.68.231:8080/ws-chat');
    this.ws = new WebSocket('ws://localhost:8080/ws-chat');
    this.ws.onopen = () => {
      console.log('WebSocket connected');
    };
    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.messageSubject.next(message);
    };
    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
    };
  }

  // Nhận tin nhắn
  getMessages(): Observable<any> {
    return this.messageSubject.asObservable();
  }

  // Gửi tin nhắn
  sendMessage(message: any): void {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not open');
    }
  }

  // Ngắt kết nối
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
    }
  }
}