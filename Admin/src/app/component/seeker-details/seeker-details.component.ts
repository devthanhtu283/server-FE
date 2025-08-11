import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Application } from 'src/app/models/application.model';
import { Seeker, User } from 'src/app/models/user.model';
import { ApplicationService } from 'src/app/service/application.service';
import { BaseUrl } from 'src/app/service/baseUrl.service';
import { JobService } from 'src/app/service/job.service';
import { UserService } from 'src/app/service/user.service';

@Component({
  templateUrl: './seeker-details.component.html',
})
export class SeekerDetailsComponent implements OnInit {
  seekerId: any;
  seeker: Seeker;
  user: User;
  applications: Application[];
  pageSize = 10;
  currentPage = 1;
  totalPages = 1;
  totalItems = 0;
  pageInfo = '';
  avatar: string | null = null;
  avatarUrl: string | null = null;
  userMembership: any = null;
  currentPlan: any = null;
  plans: any[] = [];
  hasPlan: boolean = false;

  constructor(
    private userService: UserService,
    private applicationService: ApplicationService,
    private baseUrl: BaseUrl,
    private http: HttpClient,
    private route: ActivatedRoute,
    private jobService: JobService
  ) {}

  ngOnInit() {
    this.route.params.subscribe((params) => {
      this.seekerId = params['id'];
      console.log('Seeker ID:', this.seekerId);
      this.userService.findById(this.seekerId).then((res) => {
        this.user = res['data'];
      });
      this.loadSeeekerDetails();
      this.loadHistoryApplications();
      this.loadUserMembership();
      
    });
  }
  loadPlanDetails(membershipId: number): void {
    this.jobService.findByTypeForAndDuration(1, 'MONTHLY').then(monthlyResponse => {
      this.jobService.findByTypeForAndDuration(1, 'YEARLY').then(yearlyResponse => {
        const allPlans = [...(monthlyResponse || []), ...(yearlyResponse || [])];
        this.currentPlan = allPlans.find(plan => plan.id === membershipId);
  
        if (this.currentPlan) {
          this.hasPlan = true;
        } else {
          this.hasPlan = false;
        }
      });
    }).catch(error => {
      console.error('Error loading plan details:', error);
      this.hasPlan = false;
    });
  }
  
loadUserMembership(): void {
  this.userService.findEmployerMembershipByUserId(this.seekerId)
    .then(response => {
      this.userMembership = response;
      console.log('Membership:', this.userMembership);

      if (this.userMembership && this.userMembership.membershipId) {
        // Thử tìm trong danh sách plans trước
        this.currentPlan = this.plans.find(plan => plan.id === this.userMembership.membershipId);

        if (this.currentPlan) {
          this.hasPlan = true;
        } else {
          // Nếu không tìm thấy thì load lại từ API
          this.loadPlanDetails(this.userMembership.membershipId);
        }
      } else {
        this.hasPlan = false;
      }
    })
    .catch(error => {
      console.error('Error loading membership:', error);
      this.hasPlan = false;
    });
}



  loadSeeekerDetails(): void {
    this.userService.findByIdSeeker(this.seekerId).then((res) => {
      this.seeker = res['data'];
      this.avatar = `${this.baseUrl.getUserImageUrl()}${this.seeker.avatar}`;
      console.log(this.avatar);
      this.loadAvatar();
    });
  }

  loadHistoryApplications(): void {
    this.applicationService
      .historyApplication(this.seekerId, this.currentPage - 1, this.pageSize)
      .then((res) => {
        this.applications = res['data']['content'];
        this.applications.forEach(app => {
          const avatarPath = app?.avatar;
          const imageUrl = avatarPath ? `${this.baseUrl.getUserImageUrl()}${avatarPath}` : null;

          if (imageUrl) {
            this.http.get(imageUrl, { responseType: 'blob' }).subscribe(blob => {
              const objectURL = URL.createObjectURL(blob);
              app.avatar = objectURL; // 👈 gắn trực tiếp vào từng application
            }, error => {
              console.error('Image load failed for:', imageUrl, error);
              app.avatar = null;
            });
          } else {
            app.avatar = null;
          }
        });

        this.totalPages = res['data']['totalPages'];
        this.totalItems = res['data']['totalElements'];
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
    this.loadHistoryApplications();
  }

  onPageChange(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadHistoryApplications();
    }
  }

  updatePageInfo() {
    const start = (this.currentPage - 1) * this.pageSize + 1;
    const end = Math.min(this.currentPage * this.pageSize, this.totalItems);
    this.pageInfo = `${start}–${end} của ${this.totalItems}`;
  }
}
