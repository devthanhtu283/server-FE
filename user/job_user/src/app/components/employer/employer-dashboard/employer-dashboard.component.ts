import { ApplicationService } from 'src/app/services/application.service';
import { ChangeDetectorRef, Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { User } from 'src/app/models/user.model';
import { JobService } from "src/app/services/job.service";
import { UserService } from "src/app/services/user.service";

@Component({
    templateUrl: "./employer-dashboard.component.html",

  })
export class EmployerDashboardComponent implements OnInit {

  constructor(
    private userService: UserService,
    private router: Router,
    private jobService: JobService,
    private ApplicationService: ApplicationService
  ) {}
  user: User;
  jobPostedCount = 0;
  applicationCount = 0;
  reviewCount = 0;

  ngOnInit(): void {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
      this.router.navigate(['/']); // Điều hướng lại nếu không tìm thấy user
    } else {
      this.user = user; // Gán dữ liệu người dùng
      this.loadJobPostedCount(this.user.id);
      this.loadApplicationCount(this.user.id);
      this.loadReviewCount(this.user.id);

    }
  }
  async loadJobPostedCount(employerId: number) {
    try {
      const res = await this.jobService.findByEmployerId(employerId);
      this.jobPostedCount = res?.data?.length || 0;
    } catch (err) {
      console.error("Lỗi khi lấy Job:", err);
    }
  }
  
  async loadApplicationCount(employerId: number) {
    try {
      // 1. Lấy danh sách Job theo employer
      const jobRes = await this.jobService.findByEmployerId(employerId); // giả định trả về mảng job
      const jobs = jobRes.data || [];

      let totalApplications = 0;
  
      // 2. Duyệt qua từng Job và lấy số Application theo jobId
      for (const job of jobs) {
        const jobId = job.id;
  
        // Lấy tất cả application theo job (status -1 là tất cả)
        const appRes = await this.ApplicationService.listApplication(jobId, 1, 2);
        console.log(appRes);
        const applications = appRes.data || [];
  
        totalApplications += applications.length;
      }
  
      // 3. Gán tổng số
      this.applicationCount = totalApplications;
    } catch (err) {
      console.error("❌ Lỗi khi tính tổng ứng tuyển:", err);
    }
  }
  
  
  async loadReviewCount(employerId: number) {
    try {
      const res = await this.jobService.getAllReviewsByStatus(employerId, true);
      this.reviewCount = res?.data?.length || 0;
    } catch (err) {
      console.error("Lỗi khi lấy Review:", err);
    }
  }
  
    
}