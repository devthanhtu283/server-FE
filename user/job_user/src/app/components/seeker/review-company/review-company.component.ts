import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Job, Review } from 'src/app/models/job.model';
import { Employee, User } from 'src/app/models/user.model';
import { JobService } from 'src/app/services/job.service';
import { UserService } from 'src/app/services/user.service';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { MessageService } from 'primeng/api';

@Component({
  templateUrl: './review-company.component.html',
  styleUrls: ['./review-company.component.css'],
})
export class ReviewCompanyComponent implements OnInit {
  employerId: any;
  employer: Employee;
  jobs: Job[];
  job: Job;
  rating: number = 0;
  otRating: string = ''; 
  reason: string = ''; 
  goodMessage: string = '';
  improve: string = ''; 
  review: Review;
  constructor(
    private userService: UserService,
    private jobService: JobService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private messageService: MessageService
  ) {}
  user: User;
  ngOnInit(): void {
    const user = JSON.parse(localStorage.getItem('user'));
    if (false) {
      this.router.navigate(['/']); // Điều hướng lại nếu không tìm thấy user
    } else {
      this.user = user; // Gán dữ liệu người dùng
    }

    this.route.params.subscribe(params => {
        this.employerId = params['id'];
        console.log('Job ID:', this.employerId);
  
        // Gọi API để lấy thông tin công việc theo id
        this.loadCompanyDetails();
    });
  }

  loadCompanyDetails(): void {
    this.userService.findByIdEmployer(Number.parseInt(this.employerId)).then(
      res => {
        console.log('Employer Details:', res);
        this.employer = res["data"];
      },
      err => {
        console.error('Error loading job details:', err);
      }
    );
  }

  setRating(value: number) {
    this.rating = value;
  }

  // Hàm xử lý khi submit form
  onSubmit() {
    if (
      this.rating === 0 ||
      !this.otRating ||
      !this.goodMessage ||
      !this.improve
    ) {
      this.messageService.add({
        severity: 'info',
        summary: 'Đánh giá thất bại',
        detail: 'Vui lòng điền đầy đủ các trường bắt buộc!',
      });
      return;
    }

    if (this.reason && (this.reason.length < 10 || this.reason.length > 140)) {
      this.messageService.add({
        severity: 'info',
        summary: 'Đánh giá thất bại',
        detail: 'Lý do làm việc phải từ 10 đến 140 ký tự!',
      });
      return;
    }

    if (this.goodMessage.length < 10 || this.goodMessage.length > 10000) {
      this.messageService.add({
        severity: 'info',
        summary: 'Đánh giá thất bại',
        detail: 'Điều bạn thích làm việc ở đây phải từ 10 đến 140 ký tự!',
      });
      return;
    }

    if (this.improve.length < 10 || this.improve.length > 10000) {
      this.messageService.add({
        severity: 'info',
        summary: 'Đánh giá thất bại',
        detail: 'Đề nghị cải thiện phải từ 10 đến 10000 ký tự!',
      });
      return;
    }
    let review = {
        seekerId: this.user.id,
        employerId: this.employerId,
        rating: this.rating,
        satisfied: this.otRating,
        goodMessage: this.goodMessage,
        reason: this.reason,
        improve: this.improve,
    }

    this.jobService.createReview(review).then(
        (res) => {
            this.review = res["data"];
            if(this.review != null) {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Đánh giá thành công',
                    detail: 'Cảm ơn bạn đã đánh giá! Bài đánh giá của bạn sẽ được duyệt trong thời gian sớm nhất!',
                });
                setTimeout(() => {
                    this.router.navigate(['/seeker/company/' + this.employerId]);
                },2000)
            }
        }
    )
  }
}
