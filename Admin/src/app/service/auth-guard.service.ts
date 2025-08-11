import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): boolean {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
  
    // Nếu có cả token và user trong localStorage
    if (token && user) {
      return true;
    } else {
      // Nếu không có, chuyển về trang đăng nhập
      this.router.navigate(['/login']);
      return false;
    }
  }
  
}
