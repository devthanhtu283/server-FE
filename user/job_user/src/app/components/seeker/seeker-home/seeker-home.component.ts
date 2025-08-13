import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { JobService } from 'src/app/services/job.service';
import { ApplicationService } from 'src/app/services/application.service';
import { UserService } from 'src/app/services/user.service';
import { BaseUrl } from 'src/app/services/baseUrl.service';
import { Job, Location, Worktype, Experience } from 'src/app/models/job.model';
import { MapComponent } from '../test/map.component';
import { User } from 'src/app/models/user.model';

@Component({
  selector: 'app-seeker-home',
  templateUrl: './seeker-home.component.html',
  styleUrls: ['./seeker-home.component.css'],
})
export class SeekerHomeComponent implements OnInit {
  @ViewChild(MapComponent) mapComponent!: MapComponent;

  jobs: Job[] = [];
  currentPage: number = 1;
  totalPages: number = 1;
  totalJobs: number = 0;
  pageSize: number = 6;
  readonly pageWindow = 6;
  locations: Location[] = [];
  worktypes: Worktype[] = [];
  experiences: Experience[] = [];
  searchForm: FormGroup;
  isSearching: boolean = false;
  imgBaseUrl: string;
  plans: any[] = [];
  monthlyPlans: any[] = [];
  yearlyPlans: any[] = [];
  isMonthly: boolean = true;
  user: User | null = null;
   // Biến cho dialog
   displayDialog: boolean = false;
   selectedPlan: any = null;
   agreeToTerms: boolean = false;

   // Biến để lưu thông tin gói cước đã đăng ký
   userMembership: any = null;
   currentPlan: any = null;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private userService: UserService,
    private messageService: MessageService,
    private jobService: JobService,
    private applicationService: ApplicationService,
    private changeDetectorRef: ChangeDetectorRef,
    private baseUrl: BaseUrl,
    private route: ActivatedRoute,
  ) {
    this.searchForm = this.formBuilder.group({
      title: [''],
      locationId: [''],
      worktypeId: [''],
      experienceId: [''],
      categoryId: [''], // Thêm categoryId nếu cần
    });
  }

  ngOnInit(): void {
    this.imgBaseUrl = this.baseUrl.getUserImageUrl();
    console.log('Image Base URL:', this.imgBaseUrl);

    // Đặt lại currentPage khi component khởi tạo
    this.currentPage = 1;
    this.isSearching = false;
    this.initializeData();

    const userData = localStorage.getItem('user');
        if (userData) {
            this.user = JSON.parse(userData);
            this.loadUserMembership();
        } else {

        }
        this.loadPlans();

        this.route.queryParams.subscribe(params => {
            if (params['vnp_ResponseCode']) {
                this.handlePaymentResult(params);
            }
        });
  }

  initializeData(): void {
    console.log('Initializing data with currentPage:', this.currentPage);
    this.loadJobs(this.currentPage);

    this.jobService.locationFindAll().then((res) => {
      this.locations = res.filter((location: any) => location.status === true);
      console.log('Locations:', this.locations);
      this.changeDetectorRef.detectChanges();
    });

    this.jobService.worktypeFindAll().then((res) => {
      this.worktypes = res.filter((worktype: any) => worktype.status === true);
      console.log('Worktypes:', this.worktypes);
      this.changeDetectorRef.detectChanges();
    });

    this.jobService.experienceFindAll().then((res) => {
      this.experiences = res.filter(
        (experience: any) => experience.status === true
      );
      console.log('Experiences:', this.experiences);
      this.changeDetectorRef.detectChanges();
    });
  }

  loadJobs(page: number): void {
    console.log(
      'loadJobs called with page:',
      page,
      'isSearching:',
      this.isSearching
    );
    if (page < 1 || (this.totalPages > 0 && page > this.totalPages)) {
      console.warn('Invalid page number:', page, 'Resetting to page 1');
      page = 1;
    }
    this.currentPage = page;
    if (this.isSearching) {
      this.searchJobs(page);
    } else {
      this.jobService.findAllPagination(page).subscribe({
        next: (res) => {
          this.jobs = res.content;
          this.totalPages = res.totalPages;
          this.totalJobs = res.totalElements;
          console.log('Jobs loaded:', this.jobs);
          this.changeDetectorRef.detectChanges();
        },
        error: (err) => console.error('Error loading jobs:', err),
      });
    }
  }

  searchJobs(page: number = 1): void {
    console.log(
      'searchJobs called with page:',
      page,
      'currentPage before:',
      this.currentPage
    );
    this.isSearching = true;
    this.currentPage = page;
    const searchParams = this.searchForm.value;

    // Kiểm tra nếu không có giá trị tìm kiếm nào
    if (
      !searchParams.title &&
      !searchParams.locationId &&
      !searchParams.worktypeId &&
      !searchParams.experienceId &&
      !searchParams.categoryId
    ) {
      this.isSearching = false; // Đặt lại trạng thái nếu không có tham số tìm kiếm
      this.loadJobs(page);
      return;
    }

    console.log('Search params:', searchParams);
    // Gọi API tìm kiếm
    this.jobService
      .searchJobs(
        searchParams.title || '',
        searchParams.locationId || null,
        searchParams.worktypeId || null,
        searchParams.experienceId || null,
        searchParams.categoryId || null,
        page,
        this.pageSize
      )
      .subscribe({
        next: (res) => {
          this.jobs = res.content;
          console.log('Search API Response:', res);
          this.totalPages = res.totalPages;
          this.totalJobs = res.totalElements;
          this.currentPage = page;
          console.log('Current Page after search:', this.currentPage);
          console.log('Found Jobs:', this.jobs);
          window.scrollBy(0, 600);
          this.changeDetectorRef.detectChanges();
        },
        error: (err) => {
          console.error('Search Error:', err);
          this.jobs = [];
          this.changeDetectorRef.detectChanges();
        },
      });
  }

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    console.log('Changing to page:', page);
    this.currentPage = page;
    this.loadJobs(this.currentPage);
    // Không đặt lại isSearching ở đây để giữ trạng thái tìm kiếm
  }

  resetSearch(): void {
    this.currentPage = 1;
    this.isSearching = false;
    this.searchForm.reset();
    this.loadJobs(this.currentPage);
  }

  getPages(): number[] {
    if (this.totalPages <= 0) return [];
  
    const windowSize = this.pageWindow;
    const half = Math.floor(windowSize / 2);
  
    // start mặc định: canh giữa quanh currentPage
    let start = Math.max(1, this.currentPage - half);
    let end = start + windowSize - 1;
  
    // nếu end vượt quá totalPages, kéo ngược lại
    if (end > this.totalPages) {
      end = this.totalPages;
      start = Math.max(1, end - windowSize + 1);
    }
  
    // build mảng trang
    const pages: number[] = [];
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  onLocationSelected(event: { lat: number; lng: number }): void {
    console.log('Selected Location:', event);
  }

  openMap(): void {
    this.mapComponent.openMap();
  }

  loadPlanDetails(membershipId: number): void {
    this.jobService.findByTypeForAndDuration(1, 'MONTHLY')
        .then(monthlyResponse => {
            this.jobService.findByTypeForAndDuration(1, 'YEARLY')
                .then(yearlyResponse => {
                    const allPlans = [...(monthlyResponse || []), ...(yearlyResponse || [])];
                    this.currentPlan = allPlans.find(plan => plan.id === membershipId);
                    this.changeDetectorRef.detectChanges();
                });
        })
        .catch(error => {
            console.error('Error loading plan details:', error);
        });
}

  loadPlans(): void {
    Promise.all([
      this.jobService.findByTypeForAndDuration(1, 'MONTHLY'),
      this.jobService.findByTypeForAndDuration(1, 'YEARLY'),
    ])
      .then(([monthlyResponse, yearlyResponse]) => {
        this.plans = [...(monthlyResponse || []), ...(yearlyResponse || [])];
        this.monthlyPlans = this.plans.filter(
          (plan) => plan.duration === 'MONTHLY'
        );
        this.yearlyPlans = this.plans.filter(
          (plan) => plan.duration === 'YEARLY'
        );
        if (this.userMembership && this.userMembership.membershipId) {
          this.currentPlan = this.plans.find(
            (plan) => plan.id === this.userMembership.membershipId
          );
        }
        this.changeDetectorRef.detectChanges();
      })
      .catch((error) => {
        console.error('Error loading plans:', error);
      
      });
  }

  togglePricing(): void {
    this.isMonthly = !this.isMonthly;
  }

  showConfirmDialog(plan: any): void {
    if (
      this.userMembership &&
      this.userMembership.status &&
      this.userMembership.membershipId === plan.id
    ) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cảnh báo',
        detail: 'Bạn đang sử dụng gói này rồi, vui lòng chọn gói khác.',
      });
      return;
    }

    this.selectedPlan = plan;
    this.agreeToTerms = false;
    this.displayDialog = true;
    console.log(this.selectedPlan);
  }

  proceedToPayment(): void {
    if (!this.agreeToTerms) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cảnh báo',
        detail: 'Vui lòng đồng ý với điều khoản trước khi thanh toán.',
      });
      return;
    }
  
    const amount = this.selectedPlan.price;
    localStorage.setItem('selectedPlan', JSON.stringify(this.selectedPlan));
  
    const returnUrl = window.location.origin + '/seeker/home';
  
    this.userService
      .payment(amount, returnUrl)
      .then((response) => {
        if (response && response.paymentUrl) {
          this.displayDialog = false;
          window.location.href = response.paymentUrl;
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Không thể tạo URL thanh toán.',
          });
        }
      })
      .catch((error) => {
        console.error('Error creating payment URL:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Có lỗi xảy ra khi tạo thanh toán.',
        });
      });
  }
  

  handlePaymentResult(params: any): void {
    const responseCode = params['vnp_ResponseCode'];
    const transactionNo = params['vnp_TransactionNo'] || 'N/A';
    console.log(responseCode);
    console.log(transactionNo);

    if (responseCode === '00') {
      console.log('success');
      // Thanh toán thành công, tiến hành tạo EmployerMembership và Payment
      this.createMembershipAndPayment();
    } else if (responseCode === '24') {
      this.messageService.add({
        severity: 'warn',
        summary: 'Giao dịch bị hủy',
        detail: 'Bạn đã hủy giao dịch thanh toán.',
      });
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Thanh toán thất bại',
        detail: `Giao dịch không thành công. Mã lỗi: ${responseCode}`,
      });
    }

    this.router.navigate([], {
      queryParams: {},
      replaceUrl: true,
    });
  }

  // Tạo EmployerMembership và Payment sau khi thanh toán thành công
  async createMembershipAndPayment(): Promise<void> {
    console.log('ham moi');
    console.log('userID' + this.user.id);

    const storedPlan = localStorage.getItem('selectedPlan');
    if (!storedPlan) {
      this.messageService.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không tìm thấy thông tin gói đã chọn. Vui lòng thử lại.',
      });
      return;
    }
    const selectedPlan = JSON.parse(storedPlan);
    // Xoá sau khi dùng
    localStorage.removeItem('selectedPlan');

    try {
      // Bước 1: Tạo EmployerMembership
      const membershipData = {
        userId: this.user.id,
        membershipId: selectedPlan.id,
      };
      console.log(membershipData);
      const membershipResponse =
        await this.userService.createEmployerMembership(membershipData);
      console.log(membershipResponse);
      if (membershipResponse.status) {
        const employerMembershipId = membershipResponse.object.id;
        console.log(employerMembershipId);
        // Bước 2: Tạo Payment
        const paymentData = {
          amount: selectedPlan.price,
          employerMembershipId: employerMembershipId,
        };
        console.log(paymentData);
        const paymentResponse = await this.userService.createPayment(
          paymentData
        );

        if (paymentResponse.status) {
          // Cả hai bước đều thành công
          this.messageService.add({
            severity: 'success',
            summary: 'Thanh toán thành công',
            detail: `Giao dịch của bạn đã hoàn tất. Gói cước đã được kích hoạt.`,
          });
          this.loadUserMembership();
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail:
              'Không thể tạo bản ghi thanh toán. Vui lòng liên hệ hỗ trợ.',
          });
        }
      } else {
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không thể tạo gói cước. Vui lòng thử lại.',
        });
      }
    } catch (error) {
      console.error('Error during membership and payment creation:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Có lỗi xảy ra trong quá trình xử lý. Vui lòng thử lại.',
      });
    }
  }

  loadUserMembership(): void {
    console.log(this.user);
      if (this.user && this.user.id) {
          this.userService.findEmployerMembershipByUserId(this.user.id)
              .then(response => {
                  this.userMembership = response;
                  if (this.userMembership && this.userMembership.membershipId) {
                      this.currentPlan = this.plans.find(plan => plan.id === this.userMembership.membershipId);
                      if (!this.currentPlan) {
                          this.loadPlanDetails(this.userMembership.membershipId);
                      }
                  }
                  this.changeDetectorRef.detectChanges();
              })
              .catch(error => {
                  console.error('Error loading user membership:', error);
                  this.messageService.add({ severity: 'error', summary: 'Lỗi', detail: 'Không thể tải thông tin gói cước của bạn.' });
              });
      }
  }
}
