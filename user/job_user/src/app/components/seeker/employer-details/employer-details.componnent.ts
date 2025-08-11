import { ChangeDetectorRef, Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { Follow, Job, Review } from "src/app/models/job.model";
import { Employee, User } from 'src/app/models/user.model';
import { JobService } from "src/app/services/job.service";
import { UserService } from "src/app/services/user.service";
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { MessageService } from "primeng/api";
import { BaseUrl } from "src/app/services/baseUrl.service";

@Component({
  templateUrl: "./employer-details.component.html",
  styleUrls: ['./employer-details.component.css'],
})
export class EmployerDetailsComponent implements OnInit {
  employerId: number;
  employer: Employee;
  jobs: Job[] = [];
  reviews: Review[] = [];
  follow: Follow | null = null;

  user: User | null = null;
  loggedIn: boolean = false;

  approvedPercent: number = 0;
  currentPage: number = 0;
  isHovered: boolean = false;
  imgUrl: string;

  constructor(
    private userService: UserService,
    private jobService: JobService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private messageService: MessageService,
    private baseUrl: BaseUrl
  ) {}

  ngOnInit(): void {
    this.imgUrl = this.baseUrl.getUserImageUrl();
    this.loadUserFromStorage();

    this.route.params.subscribe(params => {
      this.employerId = Number(params['id']);
      if (!this.employerId) {
        this.router.navigate(['/']);
        return;
      }

      this.loadCompanyDetails();
      this.loadCompanyJobs();
      this.loadCompanyReviews();
      this.loadCompanyPercent();

      if (this.loggedIn && this.user) {
        this.loadFollowStatus();
      }
    });
  }

  private loadUserFromStorage() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      this.user = JSON.parse(userStr);
      this.loggedIn = true;
    }
  }

  private loadFollowStatus() {
    if (!this.user?.id) return;

    this.jobService.getFollowByEmployerAndSeeker(this.employerId, this.user.id).then(
      res => {
        this.follow = res["data"] ?? null;
        this.cdr.detectChanges();
      },
      err => {
        console.error('Error loading follow:', err);
      }
    );
  }

  alert() {
    this.messageService.add({
      severity: 'info',
      summary: 'Chưa đăng nhập',
      detail: 'Bạn cần đăng nhập tài khoản để viết đánh giá. Vui lòng đăng nhập!',
    });
  }

  toggleFollow() {
    if (!this.user) {
      this.alert();
      return;
    }

    if (this.follow) {
      this.follow.status = !this.follow.status;
      this.jobService.updateFollow(this.follow).then(
        res => {
          this.follow = res["data"];
          this.cdr.detectChanges();
          this.messageService.add({
            severity: 'success',
            summary: 'Cập nhật trạng thái theo dõi',
            detail: 'Bạn đã cập nhật trạng thái theo dõi thành công!',
          });
        },
        err => console.error('Error updating follow:', err)
      );
    } else {
      const followPayload = {
        seekerId: this.user.id,
        employerId: this.employerId,
        status: true
      };

      this.jobService.createFollow(followPayload).then(
        res => {
          this.follow = res["data"];
          this.cdr.detectChanges();
          this.messageService.add({
            severity: 'success',
            summary: 'Theo dõi thành công',
            detail: 'Bạn sẽ nhận được thông báo khi có việc làm mới.',
          });
        },
        err => console.error('Error creating follow:', err)
      );
    }
  }

  onMouseEnter() {
    this.isHovered = true;
  }

  onMouseLeave() {
    this.isHovered = false;
  }

  loadCompanyDetails(): void {
    this.userService.findByIdEmployer(this.employerId).then(
      res => this.employer = res["data"],
      err => console.error('Error loading employer details:', err)
    );
  }

  loadCompanyJobs(): void {
    this.jobService.findByEmployerId(this.employerId).then(
      res => {
        this.jobs = (res["data"] || []).filter((job: any) => job.status === true);
        this.cdr.detectChanges();
      },
      err => console.error('Error loading jobs:', err)
    );
  }

  loadCompanyReviews(): void {
    this.jobService.getAllReviewsByStatus(this.employerId, true).then(
      res => {
        this.reviews = res["data"];
        this.cdr.detectChanges();
      },
      err => console.error('Error loading reviews:', err)
    );
  }

  loadCompanyPercent(): void {
    this.jobService.getApprovedPercent(this.employerId).then(
      res => {
        this.approvedPercent = res["data"];
        this.cdr.detectChanges();
      },
      err => console.error('Error loading percent:', err)
    );
  }

  getProgressCircleStyle(percent: number): string {
    return `conic-gradient(#28a745 0% ${percent}%, #e0e0e0 ${percent}% 100%)`;
  }

  splitSkills(skills: string): string[] {
    return skills ? skills.split(',').map(skill => skill.trim()) : [];
  }

  getPostedTimeAgo(date: string): string {
    const parsedDate = new Date(date);
    return formatDistanceToNow(parsedDate, { locale: vi, addSuffix: true });
  }
}
