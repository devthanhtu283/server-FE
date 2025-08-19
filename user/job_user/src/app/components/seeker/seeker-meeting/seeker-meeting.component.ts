import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Interview } from 'src/app/models/interview.model';
import { User } from 'src/app/models/user.model';
import { ApplicationService } from 'src/app/services/application.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  templateUrl: './seeker-meeting.component.html',
  styleUrls: ['./seeker-meeting.component.css'],
})
export class SeekerMeetingComponent implements OnInit {
  interviews: Interview[];
  interview: Interview;
  totalApplications: number;
  currentPage: number = 0;
  totalPages: number;
  pageSize: number;

  showConfirmModal: boolean = false;
  selectedInterviewId: number;
  selectedStatus: number;

  constructor(
    private userService: UserService,
    private applicationService: ApplicationService,
    private router: Router
  ) {}
  user: User;
  ngOnInit(): void {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
      this.router.navigate(['/']); // Điều hướng lại nếu không tìm thấy user
    } else {
      this.user = user; // Gán dữ liệu người dùng
      this.loadData();
    }
  }

  loadData(): void {
    this.applicationService
      .listInterviewOfSeeker(this.user.id, this.currentPage)
      .then((res) => {
        this.interviews = res['data']['content'];
        this.interviews.sort((a: any, b: any) => b.id - a.id);
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

  openConfirmModal(interviewId: number, status: number): void {
    this.selectedInterviewId = interviewId;
    this.selectedStatus = status;
    this.showConfirmModal = true; // Hiển thị modal xác nhận
  }

  confirmUpdateStatus(): void {
    let interviewUpdated = {
      id: this.selectedInterviewId,
      status: this.selectedStatus,
    };
    this.applicationService.update(interviewUpdated).then(
      (res) => {
        console.log('Cập nhật trạng thái thành công:', res);
        this.showConfirmModal = false; // Đóng modal
        this.loadData(); // Reload lại danh sách
      },
      (err) => {
        console.error('Lỗi khi cập nhật trạng thái:', err);
      }
    );
  }
}
