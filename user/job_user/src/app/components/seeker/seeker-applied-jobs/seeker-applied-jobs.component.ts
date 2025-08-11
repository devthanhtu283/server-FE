import { ChangeDetectorRef, Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { Application } from "src/app/models/application.model";
import { Job } from "src/app/models/job.model";
import { User } from 'src/app/models/user.model';
import { ApplicationService } from "src/app/services/application.service";
import { UserService } from "src/app/services/user.service";

@Component({
    templateUrl: "./seeker-applied-jobs.component.html",
    styleUrls: ['./seeker-applied-jobs.component.css']
  })
export class SeekerAppliedJobsComponent implements OnInit {
  currentPage: number = 0;
  totalPages: number;
  pageSize: number;
  status: number;

  constructor(
    private applicationService: ApplicationService,
    private router: Router,
    private cdr: ChangeDetectorRef,

  ) {}
  user: User;
  applications: Application[];
  ngOnInit(): void {
    const user = JSON.parse(localStorage.getItem('user'));
    this.user = user;
    this.status = 0;

    this.loadData();

  }

  filterByStatus(status: number): void {
    this.status = status;
    console.log(this.status);
    this.loadData();
  }

  loadData(): void {
    this.applicationService
      .listSeekerApplied(this.user.id, this.currentPage, this.status)
      .then((res) => {
        console.log(res);
        this.applications = res['data']['content'];
        console.log(this.applications);
        this.totalPages = res['data']['totalPages'];
        this.pageSize = res['data']['size'];
      });
  }
  // Hàm để chuyển trang
  changePage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.loadData();
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