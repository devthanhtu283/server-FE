import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, Subject, Subscription } from 'rxjs';
import { ConfirmationService, MessageService } from 'primeng/api';
import { BaseUrl } from 'src/app/service/baseUrl.service';
import { JobService } from 'src/app/service/job.service';
import { UserService } from 'src/app/service/user.service';

@Component({
  selector: 'app-review',
  templateUrl: './review.component.html',
  styleUrls: ['./review.component.css'],
})
export class ReviewComponent implements OnInit, OnDestroy {
  reviews: any[] = [];
  searchQuery = '';
  searchSubject = new Subject<string>();
  searchSubscription: Subscription | undefined;
  selectedStatus: boolean | null = null;
  selectedEmployerId: number | null = null;
  approvedPercent: number | null = null;
  employers: { id: number; companyName: string }[] = [];


  // Dialog variables
  displayDetailsDialog = false;
  selectedReview: any = {};
  currentUser: any;

  constructor(
    private jobService: JobService,
    private router: Router,
    private confirmationService: ConfirmationService,
    private baseUrl: BaseUrl,
    private messageService: MessageService,
    private userService: UserService
  ) {}

  ngOnInit() {
    // Get current user (admin) from localStorage
    this.currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (!this.currentUser || !this.currentUser.id) {
      this.router.navigate(['/']);
      return;
    }

    this.setupSearch();
    this.fetchReviews();
  }

  ngOnDestroy() {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }

  
  setupSearch() {
    this.searchSubscription = this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        this.fetchReviews();
      });
  }

  onSearch() {
    this.searchSubject.next(this.searchQuery);
  }

  filterStatus(status: boolean | null) {
    this.selectedStatus = status;
    this.fetchReviews();
  }

  filterEmployer(employerId: number | null) {
    this.selectedEmployerId = employerId;
    this.fetchApprovedPercent();
    this.fetchReviews();
  }

  async fetchReviews() {
    try {
      const employerId = this.selectedEmployerId != null ? this.selectedEmployerId : undefined;
  
      const response = await this.jobService.getAllReviewsByStatus(
        employerId,
        0,
        10,
        this.selectedStatus
      );
  
      let reviews = response.data?.content || [];
      console.log(reviews);
      // 🔁 Map để tránh gọi trùng employerId
      const employerCache = new Map<number, string>();
  
      for (const review of reviews) {
        const eid = review.employerId;

        if (eid && !employerCache.has(eid)) {
          try {
            const employer = await this.userService.findByIdEmployer(eid);
            console.log(employer);
            employerCache.set(eid, employer.data.companyName || 'Không rõ');
          } catch (err) {
            employerCache.set(eid, 'Không rõ');
          }
        }
  
        // Gắn tên công ty vào review
        review.employerName = employerCache.get(eid);
      }
  
      // 🔍 Client-side search
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        reviews = reviews.filter((r: any) =>
          r.comment?.toLowerCase().includes(q) ||
          r.employerName?.toLowerCase().includes(q) ||
          r.reason?.toLowerCase().includes(q) ||
          r.improve?.toLowerCase().includes(q)
        );
      }
  
      this.reviews = reviews;
      // 1. Lấy danh sách công ty duy nhất từ review
        const employerMap = new Map<number, string>();
        for (const review of reviews) {
        if (review.employerId && review.employerName) {
            employerMap.set(review.employerId, review.employerName);
        }
        }
        this.employers = Array.from(employerMap.entries()).map(([id, name]) => ({
        id,
        companyName: name
        }));

    } catch (err) {
      console.error('❌ Fetch reviews failed:', err);
      this.messageService.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Tải danh sách đánh giá thất bại.'
      });
    }
  }
  

  async fetchApprovedPercent() {
    if (this.selectedEmployerId === null) {
      this.approvedPercent = null;
      return;
    }
    try {
      const percent = await this.jobService.getApprovedPercent(this.selectedEmployerId);
      this.approvedPercent = percent;
    } catch (err) {
      console.error('❌ Fetch approved percent failed:', err);
      this.messageService.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Tính phần trăm đánh giá được duyệt thất bại.'
      });
    }
  }

  openDetailsDialog(review: any) {
    this.selectedReview = { ...review };
    this.displayDetailsDialog = true;
  }

  closeDetailsDialog(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.displayDetailsDialog = false;
    this.selectedReview = {};
  }

  async toggleReviewStatus(id: number, comment: string, currentStatus: boolean) {
    this.confirmationService.confirm({
        message: `Bạn có chắc muốn ${currentStatus ? 'vô hiệu hóa' : 'kích hoạt'} đánh giá <strong>${(comment || 'Không có nội dung').substring(0, 30)}${(comment && comment.length > 30) ? '...' : ''}</strong>?`,
        header: `Xác nhận ${currentStatus ? 'Vô hiệu hóa' : 'Kích hoạt'}`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Duyệt',
      rejectLabel: 'Hủy',
      acceptButtonStyleClass: 'p-button-success',
      rejectButtonStyleClass: 'p-button-danger',
      accept: async () => {
        try {
          await this.jobService.updateReviewStatus(id, !currentStatus);
          this.messageService.add({
            severity: 'success',
            summary: 'Thành công',
            detail: `${currentStatus ? 'Vô hiệu hóa' : 'Kích hoạt'} đánh giá thành công.`
          });
          await this.fetchReviews();
          await this.fetchApprovedPercent();
        } catch (err) {
          console.error('Error toggling review status:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: `${currentStatus ? 'Vô hiệu hóa' : 'Kích hoạt'} đánh giá thất bại.`
          });
        }
      }
    });
  }

  stopPropagation(event: Event) {
    event.stopPropagation();
  }
}