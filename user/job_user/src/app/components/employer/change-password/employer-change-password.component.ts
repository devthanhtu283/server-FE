import { ChangeDetectorRef, Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { User } from 'src/app/models/user.model';
import { UserService } from "src/app/services/user.service";
import * as bcrypt from 'bcryptjs';
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { MessageService } from "primeng/api";

@Component({
    templateUrl: "./employer-change-password.component.html",

  })
export class EmployerChangePasswordComponent implements OnInit {
  changePassEmployerForm: FormGroup;

  constructor(
    private userService: UserService,
    private router: Router,
    private formBuilder: FormBuilder, 
    private messageService: MessageService,
  ) {
    this.changePassEmployerForm = this.formBuilder.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required]],
      retypePassword: ['', [Validators.required]],
    });
  }
  user: User;
  ngOnInit(): void {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
      this.router.navigate(['/']); // Điều hướng lại nếu không tìm thấy user
    } else {
      this.user = user; // Gán dữ liệu người dùng
    }
  }

   // Hàm so sánh mật khẩu
   comparePassword(plainPassword: string, hashedPassword: string): boolean {
    return bcrypt.compareSync(plainPassword, hashedPassword);
  }

  changePassEmployer() {
    const isMatch = this.comparePassword(this.changePassEmployerForm.value.currentPassword , this.user.password);
    if (!isMatch) {
      this.messageService.add({
        severity: "error",
        summary: "Xác nhận lại mật khẩu",
        detail: "Mật khẩu hiện tại không đúng. Vui lòng kiểm tra lại."
      });
      return; // Ngăn không cho tiếp tục nếu mật khẩu không khớp
    }
    if(this.changePassEmployerForm.value.newPassword !== this.changePassEmployerForm.value.retypePassword) {
      this.messageService.add({
        severity: "error",
        summary: "Xác nhận lại mật khẩu",
        detail: "Mật khẩu xác nhận không trùng với mật khẩu bạn tạo. Vui lòng nhập lại"
      });
      return; // Ngăn không cho tiếp tục nếu mật khẩu không khớp
    }
    var updateUser = {
      id: this.user.id,
      username: this.user.username,
      password: this.changePassEmployerForm.value.newPassword,
      userType: this.user.userType,
      email: this.user.email,
      created: this.user.created,
      status: this.user.status,
      securityCode: this.user.securityCode,
    }
    this.userService.update(updateUser).then(
      res => {
        if(res.status) {
          this.messageService.add({
            severity: "success",
            summary: "Cập nhật thành công",
            detail: "Bạn đã cập nhật mật khẩu thành công."
          });
          location.href = '/employer/change-password';

        }
      },
      err => {
        this.messageService.add({
          severity: "error",
          summary: "Cập nhật thất bại",
          detail: "Bạn đã cập nhật mật khẩu thất bại. Vui lòng kiểm tra lại."
        });
        location.href = '/employer/change-password';

      }
    )
  }
}