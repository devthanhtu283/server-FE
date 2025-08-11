import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { UserService } from 'src/app/services/user.service';

@Component({
    templateUrl: './verify-account.component.html',
})
export class VerifyAccountComponent implements OnInit {
    constructor(
        private route: ActivatedRoute,
        private userService: UserService,
        private messageService: MessageService,
        private router: Router
    ) {}

    ngOnInit(): void {
        // Lấy email và securityCode từ URL
        this.route.queryParams.subscribe(params => {
            const email = params['email'];
            const securityCode = params['securityCode'];
            const user = JSON.parse(localStorage.getItem('user'));
            console.log(user);
            // Kiểm tra nếu có đủ email và securityCode
            if (email && securityCode) {
                // Gọi API để xác thực tài khoản
                this.userService.verifyAccount(email, securityCode).then(response => {
                    console.log('API Response:', response);
                    if (response && response.status) {
                      this.messageService.add({
                        severity: 'success',
                        summary: 'Xác thực thành công',
                        detail: 'Tài khoản của bạn đã được xác thực thành công! Bạn vui lòng đăng nhập lại.'
                    });
                    localStorage.removeItem('user');
                        setTimeout(() => {
                            this.router.navigate(['/seeker/home']);
                          }, 2000);
                   
                   
                    } else if(user.userType === 2) {
                        this.messageService.add({severity:'error', summary:'Xác thực thất bại', detail:'Mã xác thực không hợp lệ hoặc tài khoản đã xác thực.'});
                    }
                }).catch(error => {
                    console.error("API Error:", error);
                    this.messageService.add({severity:'error', summary:'Lỗi', detail:'Có lỗi xảy ra khi xác thực tài khoản.'});
                });
            } else {
                console.error("Thiếu email hoặc securityCode trong URL");
            }
        });
    }
}
