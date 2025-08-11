import { ChangeDetectorRef, Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { Follow } from "src/app/models/job.model";
import { User } from 'src/app/models/user.model';
import { BaseUrl } from "src/app/services/baseUrl.service";
import { JobService } from "src/app/services/job.service";
import { UserService } from "src/app/services/user.service";

@Component({
    templateUrl: "./seeker-follower.component.html",
    styleUrls: ['./seeker-follower.component.css'],

  })
export class SeekerFollowerComponent implements OnInit {
  
  currentPage: number = 0;
  totalPages: number = 1;
  pageSize: number;
  follows: Follow[];
  openJob: { [key: number]: number } = {};
  imgUrl: string;
  constructor(
    private userService: UserService,
    private jobService: JobService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private baseUrl: BaseUrl
  ) {}
  user: User;
  ngOnInit(): void {
    this.imgUrl = this.baseUrl.getJobImageUrl();
    const user = JSON.parse(localStorage.getItem('user'));
    if (false) {
      this.router.navigate(['/']); // Điều hướng lại nếu không tìm thấy user
    } else {
      this.user = user; // Gán dữ liệu người dùng
    }

    this.loadFollowers();

  }

  loadFollowers() {
    this.jobService.getSeekerFollowers(this.user.id, true, this.currentPage).then(
      (res) => {
        console.log(res);
        this.follows = res["data"]["content"];
      
        this.follows.forEach(follow => {
          this.getOpenJobCount(follow.employerId);
        });
        this.totalPages = res["data"]["totalPages"];
        this.pageSize = res["data"]["size"];
      }
    )
  }

  getOpenJobCount(employerId: number): void {
    this.jobService.findByEmployerId(employerId).then(
      (res) => {
        console.log(res);
        this.openJob[employerId] = res["data"].length;
      }
    )
  }
  

  changePage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.loadFollowers();
    }
  }

  getPages(): number[] {
    const pages = [];
    for (let i = 0; i < this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  
}