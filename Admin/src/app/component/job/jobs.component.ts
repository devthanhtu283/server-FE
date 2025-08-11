import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { Job } from 'src/app/models/job.model';
import { BaseUrl } from 'src/app/service/baseUrl.service';
import { JobService } from 'src/app/service/job.service';
import { UserService } from 'src/app/service/user.service';

@Component({
  templateUrl: './jobs.component.html',
})
export class JobsComponent implements OnInit {
  jobs: Job[] = [];
  searchQuery = '';
  searchSubject = new Subject<string>();
  pageSize = 10;
  currentPage = 1;
  totalPages = 1;
  totalItems = 0;
  pageInfo = '';
  employerMap: { [key: number]: any } = {};

  constructor(
    private userService: UserService,
    private router: Router,
    private confirmationService: ConfirmationService,
    private baseUrl: BaseUrl,
    private http: HttpClient,
    private messageService: MessageService,
    private jobService: JobService
  ) {}

  ngOnInit() {
    this.setupSearch();
    this.fetchJobs();
  }

  setupSearch() {
    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        this.currentPage = 1;
        this.fetchJobs();
      });
  }

  onSearch() {
    this.searchSubject.next(this.searchQuery);
  }

  onPageSizeChange() {
    this.currentPage = 1;
    this.fetchJobs();
  }

  onPageChange(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.fetchJobs();
    }
  }

  fetchJobs() {
    const params: any = {
      page: this.currentPage - 1,
      size: this.pageSize,
    };

    if (this.searchQuery) {
      params.search = this.searchQuery;
    }

    this.jobService
      .getAllJobAdmin(this.currentPage - 1, this.pageSize, params.search)
      .then((response) => {
        console.log(response);
        this.jobs = response['data']['content'];
        this.totalItems = response['data']['totalElements'];
        this.totalPages = response['data']['totalPages'];
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

        this.updatePageInfo();
      })
      .catch((err) => {
        console.error('❌ Fetch user failed:', err);
      });
  }

  editJob(id: number, status: boolean, title: string) {
    const newStatus = status === true ? false : true;
    const actionText = newStatus === true ? 'kích hoạt' : 'vô hiệu hóa';
    this.confirmationService.confirm({
      message: `Bạn có chắc muốn ${actionText} tài khoản <strong>${title}</strong>??`,
      header: 'Xác nhận thay đổi trạng thái',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Duyệt',
      rejectLabel: 'Hủy',
      acceptButtonStyleClass: 'p-button-success',
      rejectButtonStyleClass: 'p-button-danger',
      accept: async () => {
        try {
          const response = await this.jobService.findById(id);
          const job = response as Job;
          job.status = newStatus;
          const updatedJob = await this.jobService.delete(job.id);
          console.log(updatedJob);
          this.messageService.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Cập nhật trạng thái người dùng thành công.'
          });
          this.fetchJobs();
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

  updatePageInfo() {
    const start = (this.currentPage - 1) * this.pageSize + 1;
    const end = Math.min(this.currentPage * this.pageSize, this.totalItems);
    this.pageInfo = `${start}–${end} của ${this.totalItems}`;
  }
}
