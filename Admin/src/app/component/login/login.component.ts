import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { UserService } from 'src/app/service/user.service';

@Component({
  templateUrl: './login.component.html',
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private userService: UserService,
    private messageService: MessageService,
    private router: Router
  ) {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  ngOnInit() {
    this.login();
  }

  async login() {
    if (!this.loginForm.valid) {
      this.messageService.add({
        severity: 'error',
        summary: 'Đăng nhập thất bại',
        detail: 'Vui lòng điền đầy đủ thông tin.',
      });
      return;
    }

    const user = {
      email: this.loginForm.value.email,
      password: this.loginForm.value.password,
    };

    try {
      const loginResponse = await this.userService.login(user);
      if (loginResponse.status === true) {
        if (loginResponse['data']['jwt']) {
          localStorage.setItem('token', loginResponse['data']['jwt']);
          console.log('Token saved:', loginResponse['data']['jwt']);
        } else {
          console.warn('No token in login response');
        }
        const userInfo = await this.userService.findByEmail(
          this.loginForm.value.email
        );
        console.log(userInfo['data']);
        this.messageService.add({
          severity: 'success',
          summary: 'Đăng nhập thành công',
          detail: 'Bạn đã đăng nhập vào hệ thống thành công.',
        });

        localStorage.setItem('user', JSON.stringify(userInfo['data']));

        if (userInfo['data'].userType === 0) {
          const superAdmin = await this.userService.findById(
            userInfo['data'].id
          );
          localStorage.setItem('superadmin', JSON.stringify(superAdmin));
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 1000);
        } else if (userInfo['data'].userType === 2) {
          const employerInfo = await this.userService.findById(
            userInfo['data'].id
          );
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
}
