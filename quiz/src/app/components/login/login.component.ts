import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from 'src/app/services/user.service';
import { MessageService } from 'primeng/api'; 

@Component({
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  username: string = '';
  password: string = '';

  constructor(
    private router: Router,
    private userService: UserService,
    private messageService: MessageService 
  ) {}

  onLogin() {
    const user = {
      email: this.username,
      password: this.password,
    };

    this.userService.login(user).then(
      (res) => {
        console.log(res);
        if (res.status == true && res.data.user.userType == 1) {
          // Lưu email vào localStorage
          console.log(user);
          localStorage.setItem('userEmail', this.username);

          // Hiển thị thông báo đăng nhập thành công
          this.messageService.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Đăng nhập thành công!',
          });

          // Chuyển hướng sau 1 giây
          setTimeout(() => {
            this.router.navigate(['/code']);
          }, 1000);
        } else {
          // Hiển thị thông báo lỗi
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Thông tin đăng nhập không hợp lệ. Vui lòng thử lại.',
          });
        }
      },
      (err) => {
        // Hiển thị thông báo lỗi nếu có lỗi từ server
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Đã xảy ra lỗi. Vui lòng thử lại sau.',
        });
      }
    );
  }
}