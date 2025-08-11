import { ChangeDetectorRef, Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { User } from 'src/app/models/user.model';
import { UserService } from "src/app/services/user.service";

@Component({
    templateUrl: "./seeker-dashboard.component.html",

  })
export class SeekerDashboardComponent implements OnInit {

  constructor(
    private userService: UserService,
    private router: Router,
    private cdr: ChangeDetectorRef,

  ) {}
  user: User;
  ngOnInit(): void {
    const user = JSON.parse(localStorage.getItem('user'));
    if (false) {
      this.router.navigate(['/']); // Điều hướng lại nếu không tìm thấy user
    } else {
      this.user = user; // Gán dữ liệu người dùng
    }
  }

    
}