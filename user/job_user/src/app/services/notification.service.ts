import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse, Notification } from '../models/notification.model';


@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  // private apiUrl = "http://103.153.68.231:8080/job/notification";
  // private wsUrl = 'ws://103.153.68.231:8083/notifications-websocket';
  private apiUrl = "http://localhost:8080/job/notification";
  private wsUrl = 'ws://localhost:8083/notifications-websocket';
  private webSocket: WebSocket | null = null;
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  private unreadCountSubject = new BehaviorSubject<number>(0);

  notifications$ = this.notificationsSubject.asObservable();
  unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(private http: HttpClient) {}

  connect(userId: number) {
    if (this.webSocket) {
      this.webSocket.close();
    }

    // Kết nối WebSocket với userId qua query parameter
    this.webSocket = new WebSocket(`${this.wsUrl}?userId=${userId}`);
    this.webSocket.onopen = () => {
      console.log("🧪 WebSocket URL:", this.webSocket);
      console.log('WebSocket connected');
    };

    this.webSocket.onmessage = (event) => {
      const newNotification: Notification = JSON.parse(event.data);
      const currentNotifications = this.notificationsSubject.value;
      this.notificationsSubject.next([newNotification, ...currentNotifications]);
      this.updateUnreadCount(userId);
    };

    this.webSocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.webSocket.onclose = () => {
      console.log('WebSocket disconnected');
      this.webSocket = null;
    };
  }

  disconnect() {
    if (this.webSocket) {
      this.webSocket.close();
      this.webSocket = null;
    }
  }

  getNotifications(userId: number): Observable<Notification[]> {
    return this.http.get<ApiResponse>(`${this.apiUrl}/${userId}`).pipe(
      map(response => response.data || [])
    );
  }

  getUnreadNotifications(userId: number): Observable<Notification[]> {
    return this.http.get<ApiResponse>(`${this.apiUrl}/${userId}/unread`).pipe(
      map(response => response.data || [])
    );
  }

  markAsRead(notificationId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${notificationId}/read`, {});
  }

  markAsReadAll(userId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${userId}/readAll`, {});
  }

  updateUnreadCount(userId: number) {
    this.getUnreadNotifications(userId).subscribe({
      next: (notifications) => {
        const count = Array.isArray(notifications) ? notifications.length : 0;
        console.log('Unread notifications count:', count);
        this.unreadCountSubject.next(count);
      },
      error: (err) => {
        console.error('Error fetching unread notifications:', err);
        this.unreadCountSubject.next(0);
      }
    });
  }

  updateNotifications(notifications: Notification[]) {
    this.notificationsSubject.next(notifications);
  }

}