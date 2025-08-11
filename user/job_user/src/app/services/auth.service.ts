import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://103.153.68.231:8080'; // URL của gateway-service
  private token: string | null = null;

  constructor(private http: HttpClient) {
    // Khởi tạo token từ localStorage khi service được tạo
    this.token = localStorage.getItem('token');
    console.log('Initial token:', this.token);
  }

  login(email: string, password: string): Observable<any> {
    const body = { email, password };
    return this.http.post(`${this.apiUrl}/user/login`, body).pipe(
      tap((response: any) => {
        console.log('Login response:', response["data"]["jwt"]);
        if (response &&  response["data"]["jwt"]) {
          this.token =  response["data"]["jwt"];
          localStorage.setItem('token', this.token);
          console.log('Token saved:', this.token);
        } else {
          console.warn('No token in login response');
        }
      })
    );
  }

  getToken(): string | null {
    const token = this.token || localStorage.getItem('token');
    console.log('Getting token:', token);
    return token;
  }

  logout(): void {
    this.token = null;
    localStorage.removeItem('token');
    console.log('Logged out, token cleared');
  }

  isLoggedIn(): boolean {
    const loggedIn = !!this.getToken();
    console.log('Is logged in:', loggedIn);
    return loggedIn;
  }
}