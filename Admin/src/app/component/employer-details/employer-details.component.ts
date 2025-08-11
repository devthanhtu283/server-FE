import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Application } from 'src/app/models/application.model';
import { Job, Review } from 'src/app/models/job.model';
import { Employee, Seeker, User } from 'src/app/models/user.model';
import { ApplicationService } from 'src/app/service/application.service';
import { BaseUrl } from 'src/app/service/baseUrl.service';
import { JobService } from 'src/app/service/job.service';
import { UserService } from 'src/app/service/user.service';

@Component({
  templateUrl: './employer-details.component.html',
  styleUrls: ['./employer-details.component.css'],
})
export class EmployerDetailsComponent implements OnInit {
  employeeId: any;
  employee: Employee;
  user: User;
  jobs: Job[];
  reviews: Review[];
  pageSize = 10;
  currentPage = 1;
  totalPages = 1;
  totalItems = 0;
  pageInfo = '';
  avatar: string | null = null;
  avatarUrl: string | null = null;
  seekerMap: { [key: number]: any } = {};
  userMembership: any = null;
  currentPlan: any = null;
  plans: any[] = [];
  constructor(
    private userService: UserService,
    private jobService: JobService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private baseUrl: BaseUrl,
    private http: HttpClient,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.route.params.subscribe((params) => {
      this.employeeId = params['id'];
      console.log('Seeker ID:', this.employeeId);
      this.userService.findById(this.employeeId).then((res) => {
        this.user = res['data'];
      });
      this.loadSeeekerDetails();
      this.loadJobs();
      this.loadReviews();
      this.loadUserMembership();
    });
  }

  loadUserMembership(): void {
  
      this.userService
        .findEmployerMembershipByUserId(this.employeeId)
        .then((response) => {
          this.userMembership = response;
          if (this.userMembership && this.userMembership.status && this.userMembership.membershipId) {
            this.currentPlan = this.plans.find((plan) => plan.id === this.userMembership.membershipId);
            if (!this.currentPlan) {
              this.loadPlanDetails(this.userMembership.membershipId);
            }
          } else {
            // No active membership, ensure currentPlan is null
            this.currentPlan = null;
          }
   
        })
        .catch((error) => {
          console.error('Error loading user membership:', error);
          this.currentPlan = null; // Ensure no plan is shown on error
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Không thể tải thông tin gói cước của bạn.',
          });
       
        });
    
  }

  loadPlanDetails(membershipId: number): void {
    this.jobService
      .findByTypeForAndDuration(2, 'MONTHLY')
      .then((monthlyResponse) => {
        this.jobService.findByTypeForAndDuration(2, 'YEARLY').then((yearlyResponse) => {
          const allPlans = [...(monthlyResponse || []), ...(yearlyResponse || [])];
          this.currentPlan = allPlans.find((plan) => plan.id === membershipId);
   
        });
      })
      .catch((error) => {
        console.error('Error loading plan details:', error);
      });
  }


  loadSeeekerDetails(): void {
    this.userService.findByIdEmployer(this.employeeId).then((res) => {
      this.employee = res['data'];
      this.avatar = `${this.baseUrl.getUserImageUrl()}${this.employee.logo}`;
      console.log(this.avatar);
      this.loadAvatar();
    });
  }

  loadReviews(): void {
    this.jobService.getAllReviewsByStatus(this.employeeId, this.currentPage - 1, this.pageSize).then(
      async (res) => {
        console.log(res);
        this.reviews = res["data"]["content"];
        this.totalPages = res['totalPages'];
        this.totalItems = res['totalElements'];

        const seekerIds = Array.from(new Set(this.reviews.map(r => r.seekerId)));

        await Promise.all(seekerIds.map(async (id) => {
          const seeker = await this.userService.findByIdSeeker(id);
          this.seekerMap[id] = seeker["data"];
        }));

        this.reviews = this.reviews.map(review => ({
          ...review,
          seeker: this.seekerMap[review.seekerId]
        }));
      }
    );
    this.updatePageInfo();
  }


  loadJobs(): void {
    this.jobService
      .findByEmployerIdPagination(this.employeeId, this.currentPage, this.pageSize)
      .then((res) => {
        this.jobs = res["content"];
        this.jobs.forEach(app => {
          const avatarPath = app?.employerLogo;
          const imageUrl = avatarPath ? `${this.baseUrl.getUserImageUrl()}${avatarPath}` : null;

          if (imageUrl) {
            this.http.get(imageUrl, { responseType: 'blob' }).subscribe(blob => {
              const objectURL = URL.createObjectURL(blob);
              app.employerLogo = objectURL;
            }, error => {
              console.error('Image load failed for:', imageUrl, error);
              app.employerLogo = null;
            });
          } else {
            app.employerLogo = null;
          }
        });
        this.totalPages = res['totalPages'];
        this.totalItems = res['totalElements'];
        this.updatePageInfo();
      });
  }

  loadAvatar() {
    this.http.get(this.avatar, {
      responseType: 'blob'
    }).subscribe(blob => {
      const objectURL = URL.createObjectURL(blob);
      this.avatarUrl = objectURL;
    }, error => {
      console.error('Image load failed:', error);
    });
  }


  onPageSizeChange() {
    this.currentPage = 1;
    this.loadReviews();
    this.loadJobs();
  }


  onPageChange(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadJobs();
    }
  }

  updatePageInfo() {
    const start = (this.currentPage - 1) * this.pageSize + 1;
    const end = Math.min(this.currentPage * this.pageSize, this.totalItems);
    this.pageInfo = `${start}–${end} của ${this.totalItems}`;
  }

  getJobStatus(job: any): { label: string; class: string } {
    const now = new Date();
    const expired = new Date(job.postedExpired);

    if (job.status || expired < now) {
      return { label: 'Đã đóng', class: 'text-bg-danger' };
    }

    if (expired < now) {
      return { label: 'Hết hạn', class: 'text-bg-secondary' };
    }
    return { label: 'Còn tuyển', class: 'text-bg-success' };
  }

  getReviewStatus(review: any): { label: string; class: string } {

    if (review.status === false) {
      return { label: 'Không Hợp lệ', class: 'text-bg-danger' };
    } else {
      return { label: 'Hợp lệ', class: 'text-bg-success' };
    }
  }

  editReview(id: number) {
    this.confirmationService.confirm({
      message: `Bạn có chắc muốn cập nhật trạng thái cho đánh giá này??`,
      header: 'Xác nhận thay đổi trạng thái',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Duyệt',
      rejectLabel: 'Hủy',
      acceptButtonStyleClass: 'p-button-success',
      rejectButtonStyleClass: 'p-button-danger',
      accept: async () => {
        try {
          const response = await this.jobService.updateReviewStatus(id);
          const review = response.data;
          this.messageService.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Cập nhật trạng thái người dùng thành công.'
          });
          this.loadReviews();
        } catch (error) {
          console.error('Error updating status:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Thất bại',
            detail: 'Cập nhật trạng thái người dùng thất bại.'
          });
        }
      }
    })
  }

}
