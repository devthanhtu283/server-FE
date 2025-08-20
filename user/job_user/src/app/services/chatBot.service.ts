import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = 'http://103.153.68.231:8000/python/chat'; // Thay bằng API endpoint của bạn

  constructor(private http: HttpClient) {}

  sendMessage(message: string, userId: string): Observable<any> {
    const body = {
      message: message,
      user_id: userId
    };
    return this.http.post(this.apiUrl, body);
  }
}