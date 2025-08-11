import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { MessageService } from 'primeng/api';
import { UserService } from 'src/app/services/user.service';
import { CreateUser, User } from 'src/app/models/user.model';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';

@Component({
    templateUrl: './forgot-password.component.html',
    styleUrls: ['./forgot-password.component.css'],
})
export class ForgotPasswordComponent implements OnInit, OnDestroy {
    currentForm: string = 'candidate'; // Ban đầu hiển thị form candidate
    registerCandidateForm: FormGroup;
    registerEmployerForm: FormGroup;
    checkEmailForm: FormGroup;
    loginForm: FormGroup;
    newCandidate: CreateUser;
    candidate: User;
    newEmployer: CreateUser;
    employer: User;
    user: User;
    randomNumber = Math.floor(100000 + Math.random() * 900000);
    showForgotModal = true;
    showResetPasswordModal = false;
    email: string = '';
    verificationCode: string = '';
    newPassword: string = '';
    retypePassword: string = '';
    isVerificationSent: boolean = false;
    verifyCode: string = '';
    expiredCode: Date;
    userUpdated: User;
    private countdownTime = 5 * 60 * 1000; // 5 phút
    timeLeft: string = '';
    private timerSubscription: Subscription;
    constructor(private userService: UserService, private router: Router, private messageService: MessageService, private formBuilder: FormBuilder, private datePipe: DatePipe) {
        this.registerCandidateForm = this.formBuilder.group({
            candidateName: ['', [Validators.required]],
            candidateEmail: ['', [Validators.required, Validators.email]],
            candidatePassword: ['', [Validators.required]],
            candidateConfirmPassword: ['', [Validators.required]]
        });
        this.registerEmployerForm = this.formBuilder.group({
            employerName: ['', [Validators.required]],
            employerEmail: ['', [Validators.required, Validators.email]],
            employerPassword: ['', [Validators.required]],
            employerConfirmPassword: ['', [Validators.required]]
        });
        this.loginForm = this.formBuilder.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required]],
        });
    }

    ngOnInit(): void {
        this.showForm(this.currentForm);
    }
    showForm(form: string) {
        this.currentForm = form; // Cập nhật form hiện tại
    }
    ngOnDestroy() {
        if (this.timerSubscription) {
            this.timerSubscription.unsubscribe();
        }
    }

    private startCountdown() {
        const endTime = Date.now() + this.countdownTime;
        this.timerSubscription = interval(1000).subscribe(() => {
            const now = Date.now();
            const timeRemaining = endTime - now;

            if (timeRemaining <= 0) {
                this.timeLeft = '00:00';
                this.timerSubscription.unsubscribe();
            } else {
                const minutes = Math.floor((timeRemaining % (1000 * 3600)) / (1000 * 60));
                const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);
                this.timeLeft = `${this.pad(minutes)}:${this.pad(seconds)}`;
            }
        });
    }

    private pad(value: number): string {
        return value < 10 ? `0${value}` : `${value}`;
    }


    // Gọi hàm gửi mã xác thực
    sendVerificationEmail(): void {
        if (this.email) {
            // Gửi email với mã xác thực (thực hiện gọi API ở đây)
            console.log(`Gửi mã xác thực đến ${this.email}`);
            this.userService.findByEmail(this.email).then(
                (res) => {
                    if (res != null) {
                        const code = Math.floor(100000 + Math.random() * 900000).toString(); // Mã 6 chữ số
                        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 phút
                        // const expiresAt = new Date(Date.now() + 10 * 1000); // 10 seconds
                        const emailContent = `Mã xác nhận của bạn là ${code}. Mã sẽ hết hạn sau 5 phút.`;
                        this.verifyCode = code;
                        this.expiredCode = expiresAt;
                        var user = res["data"] as User;
                        this.userUpdated = user;
                        console.log(this.userUpdated);
                        // Gửi email xác thực
                        const email = {
                            from: 'atun123456789cu@gmail.com',
                            to: user.email,
                            subject: 'Xác thực tài khoản',
                            content: emailContent
                        };
                        this.userService.sendEmail(email);
                        this.isVerificationSent = true; // Hiển thị form nhập lại mật khẩu
                        this.startCountdown();
                    } else {
                        this.messageService.add({
                            severity: "error",
                            summary: "Thất bại",
                            detail: "Email không tồn tại. Vui lòng xác nhận lại."
                        });
                        this.router.navigate(['/forgot-password']);
                    }
                },
                (err) => {
                    this.messageService.add({
                        severity: "error",
                        summary: "Thất bại",
                        detail: "Email không tồn tại. Vui lòng xác nhận lại."
                    });
                    this.router.navigate(['/forgot-password']);
                }
            )
        }
    }


    // Gọi hàm đặt lại mật khẩu
    resetPassword(): void {
        if(this.retypePassword !== this.newPassword) {
            this.messageService.add({
                severity: "error",
                summary: "Mật khẩu không trùng",
                detail: "Mật khẩu xác nhận không trùng với mật khẩu mới."
            });
            return;
        }
        if (this.verificationCode && this.newPassword) {
            if (this.verificationCode === this.verifyCode && this.expiredCode && new Date() < this.expiredCode) {
                var user: User = {
                    id: this.userUpdated.id,
                    username: this.userUpdated.username,
                    password: this.newPassword,
                    email: this.userUpdated.email,
                    securityCode: this.userUpdated.securityCode,
                    status: 1,
                    created: this.userUpdated.created,
                    userType: this.userUpdated.userType
                }
                this.userService.update(user).then(
                    (res) => {
                        this.messageService.add({
                            severity: "success",
                            summary: "Thành công",
                            detail: "Cập nhật mật khẩu thành công"
                        });
                        this.router.navigate(['/']);
                    },
                    (err) => {
                        this.messageService.add({
                            severity: "error",
                            summary: "Thất bại",
                            detail: "Cập nhật mật khẩu thất bại"
                        });
                        this.router.navigate(['/forgot-password']);
                    }
                )
            } else {
                this.messageService.add({
                    severity: "error",
                    summary: "Thất bại",
                    detail: "Cập nhật mật khẩu thất bại. Do bạn nhập mã xác thực sai hoặc mã xác thực đã hết hạn"
                });
                this.router.navigate(['/forgot-password']);
            }
            // Xác thực mã và đặt lại mật khẩu (thực hiện gọi API ở đây)
            console.log(`Xác thực mã: ${this.verificationCode}`);
            console.log(`Đặt lại mật khẩu mới: ${this.newPassword}`);
            // Reset các trường
            this.email = '';
            this.verificationCode = '';
            this.newPassword = '';
            this.isVerificationSent = false;
        }
    }

    // Hàm đăng kí cho ứng viên 
    registerCandidate() {
        // Nếu xác nhận mật khẩu không khớp sẽ đăng kí thất bại
        if (this.registerCandidateForm.value.candidatePassword !== this.registerCandidateForm.value.candidateConfirmPassword) {
            this.messageService.add({
                severity: "error",
                summary: "Xác nhận lại mật khẩu",
                detail: "Mật khẩu xác nhận không trùng với mật khẩu bạn tạo. Vui lòng nhập lại"
            });
            return; // Ngăn không cho tiếp tục nếu mật khẩu không khớp
        }

        // Điền đầy đủ thông tin
        if (!this.registerCandidateForm.valid) {
            this.messageService.add({
                severity: "error",
                summary: "Đăng kí thất bại",
                detail: "Vui lòng điền đầy đủ thông tin."
            });
            return; // Ngăn không cho tiếp tục nếu mật khẩu không khớp
        }

        this.newCandidate = {
            username: this.registerCandidateForm.value.candidateName,
            email: this.registerCandidateForm.value.candidateEmail,
            password: this.registerCandidateForm.value.candidatePassword,
            userType: 1,
            created: this.datePipe.transform(new Date(), 'dd/MM/yyyy'),
            securityCode: this.randomNumber.toString(),
            status: 0
        };

        this.userService.register(this.newCandidate).then(
            res => {
                var result = res as boolean;
                this.messageService.add({ severity: 'success', summary: 'Gửi xác nhận về mail', detail: 'Bạn đã tạo tài khoản thành công. Sẽ có 1 email để bạn xác thực tài khoản.' });
                if (res) {
                    this.userService.findByEmail(this.newCandidate.email).then((response: any) => {
                        this.candidate = response.user;
                        console.log(this.candidate);
                        if (this.candidate) {
                            localStorage.setItem('user', JSON.stringify(this.candidate));
                            // Gửi email để verify tài khoản 
                            const emailContent = `
                    <p>Chào bạn,</p>
                    <p>Cảm ơn bạn đã đăng ký tài khoản. Vui lòng nhấp vào liên kết dưới đây để xác nhận tài khoản của bạn:</p>
                    <a href='http://103.153.68.231:4200/verify-account?email=${encodeURIComponent(this.candidate.email)}&securityCode=${this.candidate.securityCode}'>Xác nhận tài khoản</a>
                  `;
                            const email = {
                                from: 'truongvanhuong221196@gmail.com',
                                to: this.candidate.email,
                                subject: 'Xác thực tài khoản',
                                content: emailContent
                            };
                            console.log(email);
                            this.userService.sendEmail(email).then(
                                (res) => {
                                    console.log(res);
                                }
                            );
                        }
                    });
                }
                console.log(res);
            },
            err => {
                this.messageService.add({ severity: 'error', summary: 'Thất bại', detail: 'Đăng kí thất bại' });
            }
        )

    }

    // Hàm đăng kí cho nhà tuyển dụng
    registerEmployer() {
        // Nếu xác nhận mật khẩu không khớp sẽ đăng kí thất bại
        if (this.registerEmployerForm.value.candidatePassword !== this.registerEmployerForm.value.candidateConfirmPassword) {
            this.messageService.add({
                severity: "error",
                summary: "Xác nhận lại mật khẩu",
                detail: "Mật khẩu xác nhận không trùng với mật khẩu bạn tạo. Vui lòng nhập lại"
            });
            return; // Ngăn không cho tiếp tục nếu mật khẩu không khớp
        }

        // Điền đầy đủ thông tin
        if (!this.registerEmployerForm.valid) {
            this.messageService.add({
                severity: "error",
                summary: "Đăng kí thất bại",
                detail: "Vui lòng điền đầy đủ thông tin."
            });
            return; // Ngăn không cho tiếp tục nếu mật khẩu không khớp
        }

        this.newEmployer = {
            username: this.registerEmployerForm.value.employerName,
            email: this.registerEmployerForm.value.employerEmail,
            password: this.registerEmployerForm.value.employerPassword,
            userType: 2,
            created: this.datePipe.transform(new Date(), 'dd/MM/yyyy'),
            securityCode: this.randomNumber.toString(),
            status: 0
        };

        this.userService.register(this.newEmployer).then(
            res => {
                var result = res as boolean;
                this.messageService.add({ severity: 'success', summary: 'Gửi xác nhận về mail', detail: 'Bạn đã tạo tài khoản thành công. Sẽ có 1 email để bạn xác thực tài khoản.' });
                if (res) {
                    this.userService.findByEmail(this.newEmployer.email).then((response: any) => {
                        this.employer = response.user;
                        if (this.employer) {
                            localStorage.setItem('user', JSON.stringify(this.employer));
                            // Gửi email để verify tài khoản 
                            const emailContent = `
                    <p>Chào bạn,</p>
                    <p>Cảm ơn bạn đã đăng ký tài khoản. Vui lòng nhấp vào liên kết dưới đây để xác nhận tài khoản của bạn:</p>
                    <a href='http://103.153.68.231:4200/verify-account?email=${encodeURIComponent(this.employer.email)}&securityCode=${this.employer.securityCode}'>Xác nhận tài khoản</a>
                  `;
                            const email = {
                                from: 'truongvanhuong221196@gmail.com',
                                to: this.employer.email,
                                subject: 'Xác thực tài khoản',
                                content: emailContent
                            };
                            this.userService.sendEmail(email).then(
                                (res) => {
                                    console.log(res);
                                }
                            );
                        }
                    });
                }
                console.log(res);
            },
            err => {
                this.messageService.add({ severity: 'error', summary: 'Thất bại', detail: 'Đăng kí thất bại' });
            }
        )

    }

    // Hàm đăng nhập
    login() {
        // Điền đầy đủ thông tin
        if (!this.loginForm.valid) {
            this.messageService.add({
                severity: "error",
                summary: "Đăng kí thất bại",
                detail: "Vui lòng điền đầy đủ thông tin."
            });
            return; // Ngăn không cho tiếp tục nếu mật khẩu không khớp
        }

        var user = {
            email: this.loginForm.value.email,
            password: this.loginForm.value.password,
        };
        this.userService.login(user).then(
            res => {
                if (res.status === true) {
                    this.userService.findByEmail(this.loginForm.value.email).then(
                        res => {
                            this.messageService.add({
                                severity: "success",
                                summary: "Đăng nhập thành công",
                                detail: "Bạn đã đăng nhập vào hệ thống thành công."
                            });
                            localStorage.setItem('user', JSON.stringify(res['user']));
                            setTimeout(() => {
                                window.location.href = '/candidate-dashboard';
                            }, 1000);
                        },
                        err => {
                            this.messageService.add({ severity: 'error', summary: 'Thất bại', detail: 'Không thể lấy thông tin người dùng' });
                        }
                    );
                } else {
                    // Thông báo khi đăng nhập thất bại
                    this.messageService.add({ severity: 'error', summary: 'Đăng nhập thất bại', detail: 'Thông tin đăng nhập không chính xác.' });
                }
            },
            err => {
                // Xử lý lỗi kết nối hoặc server
                console.error(err);
                this.messageService.add({ severity: 'error', summary: 'Lỗi kết nối', detail: 'Đã xảy ra lỗi khi kết nối tới máy chủ. Vui lòng thử lại sau.' });
            }
        );


    }
}
