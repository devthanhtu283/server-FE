// src/app/components/seeker-list-jobs/seeker-list-jobs.component.ts
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Category, Experience, Location, Worktype } from 'src/app/models/job.model';
import { BaseUrl } from 'src/app/services/baseUrl.service';
import { JobService } from 'src/app/services/job.service';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

@Component({
  templateUrl: './seeker-list-jobs.component.html',
  styleUrls: ['./seeker-list-jobs.component.css']
})
export class SeekerListJobsComponent implements OnInit {
  jobs: any[] = [];
  categoryId: number | null = null;
  currentPage: number = 1;
  totalPages: number = 1;
  totalJobs: number = 0;
  readonly pageWindow = 6;
  isSearchingBar: boolean = false; // Trạng thái tìm kiếm cho thanh TopCV
  isSearchingForm: boolean = false; // Trạng thái tìm kiếm cho khung chi tiết
  locations: Location[] = [];
  worktypes: Worktype[] = [];
  experiences: Experience[] = [];
  categories: Category[] = [];
  searchForm: FormGroup;
  seekerId: number | null = null;
  imgBaseUrl: string;

  // Biến cho thanh tìm kiếm TopCV
  searchTitle: string = '';
  selectedLocationId: number | null = null;
  selectedCategoryId: number | null = null;
  private searchSubject = new Subject<void>();

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef,
    private jobService: JobService,
    private changeDetectorRef: ChangeDetectorRef,
    private fb: FormBuilder,
    private messageService: MessageService,
    private baseUrl: BaseUrl,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    // Khởi tạo base URL cho hình ảnh
    this.imgBaseUrl = this.baseUrl.getUserImageUrl();

    // Lấy thông tin seeker từ localStorage
    const seekerInfo = localStorage.getItem('candidate');
    if (seekerInfo) {
      const seeker = JSON.parse(seekerInfo);
      this.seekerId = seeker.data.id;
    }

    this.route.queryParams.subscribe(params => {
      this.categoryId = params['categoryId'] ? +params['categoryId'] : null;
  
      // Tải danh sách công việc
      this.jobService.searchJobs(
        undefined, 
        undefined, 
        undefined, 
        undefined,
        this.categoryId, 
        1,
        6
      ).subscribe({
        next: (res) => {
          this.jobs = res.content;
          this.totalPages = res.totalPages;
          this.totalJobs = res.totalElements;
    
          // Kiểm tra trạng thái yêu thích
          this.jobs.forEach((job) => {
            if (!this.seekerId) {
              job.checkFavorite = false;
            } else {
              this.jobService.favoriteCheckExists(job.id, this.seekerId).then((res) => {
                job.checkFavorite = res.status;
                this.cdr.detectChanges();
              });
            }
          });
        },
        error: (err) => {
          console.error('Error loading jobs:', err);
        }
      });
    });

    // Khởi tạo form tìm kiếm cho khung chi tiết
    this.searchForm = this.fb.group({
      title: [''],
      locationId: [null],
      worktypeId: [null],
      experienceId: [null],
      categoryId: [null]
    });

    // Lấy danh sách dữ liệu cho dropdown
    this.jobService.locationFindAll().then((res) => {
      this.locations = res.filter((location: any) => location.status === true);
      this.changeDetectorRef.detectChanges();
    });

    this.jobService.worktypeFindAll().then((res) => {
      this.worktypes = res.filter((worktype: any) => worktype.status === true);
      this.changeDetectorRef.detectChanges();
    });

    this.jobService.categoryFindAll().then((res) => {
      this.categories = res.filter((category: any) => category.status === 1);
      this.changeDetectorRef.detectChanges();
    });

    this.jobService.experienceFindAll().then((res) => {
      this.experiences = res.filter((experience: any) => experience.status === true);
      this.changeDetectorRef.detectChanges();
    });

    // Thiết lập debounce cho tìm kiếm TopCV
    this.searchSubject.pipe(debounceTime(300)).subscribe(() => {
      this.searchBarJobs(this.currentPage);
    });

    // Tải danh sách công việc mặc định
    if(this.categoryId == null) {
      this.loadJobs(this.currentPage);
    }
  }

  // Hàm tải danh sách công việc (gộp loadJobs và loadBarJobs)
  loadJobs(page: number): void {
    this.currentPage = page;
    
    // Ưu tiên tìm kiếm từ khung chi tiết (searchJobs) nếu isSearchingForm là true
    if (this.isSearchingForm) {
      this.searchJobs(page);
    }
    // Nếu không, kiểm tra tìm kiếm từ thanh TopCV (searchBarJobs)
    else if (this.isSearchingBar) {
      this.searchBarJobs(page);
    }
    // Nếu không có tìm kiếm nào, tải danh sách công việc mặc định
    else {
      this.jobService.findAllPagination(page).subscribe({
        next: (res) => {
          this.jobs = res.content;
          this.totalPages = res.totalPages;
          this.totalJobs = res.totalElements;

          // Kiểm tra trạng thái yêu thích
          this.jobs.forEach((job) => {
            if (!this.seekerId) {
              job.checkFavorite = false;
            } else {
              this.jobService.favoriteCheckExists(job.id, this.seekerId).then((res) => {
                job.checkFavorite = res.status;
                this.cdr.detectChanges();
              });
            }
          });
        },
        error: (err) => {
          console.error('Error loading jobs:', err);
          this.jobs = [];
        }
      });
    }
  }

  // Hàm tìm kiếm cho thanh TopCV
  searchBarJobs(page: number = 1): void {
    this.isSearchingBar = true;
    this.isSearchingForm = false; // Đặt lại trạng thái tìm kiếm của khung chi tiết

    // Kiểm tra nếu không có giá trị tìm kiếm nào
    if (!this.searchTitle && !this.selectedLocationId && !this.selectedCategoryId) {
      this.isSearchingBar = false;
      this.loadJobs(page);
      return;
    }

    // Gọi API tìm kiếm
    this.jobService.searchBarJobs(
      this.searchTitle,
      this.selectedLocationId,
      this.selectedCategoryId,
      page,
      6
    ).subscribe({
      next: (res) => {
        this.jobs = res.content;
        this.totalPages = res.totalPages;
        this.totalJobs = res.totalElements;
        this.currentPage = page;

        // Kiểm tra trạng thái yêu thích
        this.jobs.forEach((job) => {
          if (!this.seekerId) {
            job.checkFavorite = false;
          } else {
            this.jobService.favoriteCheckExists(job.id, this.seekerId).then((res) => {
              job.checkFavorite = res.status;
              this.cdr.detectChanges();
            });
          }
        });
      },
      error: (err) => {
        console.error('Search Error:', err);
        this.jobs = [];
      }
    });
  }

  // Hàm tìm kiếm cho khung chi tiết
  searchJobs(page: number = 1): void {
    this.isSearchingForm = true;
    this.isSearchingBar = false; // Đặt lại trạng thái tìm kiếm của thanh TopCV

    const searchParams = this.searchForm.value;

    // Kiểm tra nếu không có giá trị tìm kiếm nào
    if (!searchParams.title && !searchParams.locationId && !searchParams.worktypeId && !searchParams.experienceId && !searchParams.categoryId) {
      this.isSearchingForm = false;
      this.loadJobs(page);
      return;
    }
    console.log(searchParams.categoryId);
    // Gọi API tìm kiếm
    this.jobService.searchJobs(
      searchParams.title || '',
      searchParams.locationId || null,
      searchParams.worktypeId || null,
      searchParams.experienceId || null,
      searchParams.categoryId || null,
      page,
      6
    ).subscribe({
      next: (res) => {
        this.jobs = res.content;
        console.log(this.jobs);
        this.totalPages = res.totalPages;
        this.totalJobs = res.totalElements;
        this.currentPage = page;

        // Kiểm tra trạng thái yêu thích
        this.jobs.forEach((job) => {
          if (!this.seekerId) {
            job.checkFavorite = false;
          } else {
            this.jobService.favoriteCheckExists(job.id, this.seekerId).then((res) => {
              job.checkFavorite = res.status;
              this.cdr.detectChanges();
            });
          }
        });
      },
      error: (err) => {
        console.error('Search Error:', err);
        this.jobs = [];
      }
    });
  }

  // Hàm xử lý khi nhập từ khóa trong thanh TopCV
  onSearchChange(): void {
    this.searchSubject.next();
  }

  // Hàm xử lý thay đổi trang
  changePage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadJobs(this.currentPage);
  }

  // Hàm lấy danh sách các trang
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

  // Hàm hiển thị khoảng công việc
  getJobRange(): string {
    const jobCount = this.totalJobs;
    const start = (this.currentPage - 1) * 6 + 1;
    const end = Math.min(this.currentPage * 6, this.totalJobs);
    return `Hiển thị ${start}-${end} trong tổng số ${jobCount} kết quả`;
  }

  // Hàm thêm công việc vào danh sách yêu thích
  addFavorite(jobId: number): void {
    const seekerInfo = localStorage.getItem('candidate');
    if (seekerInfo) {
      const favorite = {
        seekerId: this.seekerId,
        jobId: jobId
      };
      this.jobService.favoriteCreate(favorite).then((res) => {
        if (res.status) {
          this.loadJobs(this.currentPage);
          this.messageService.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Lưu việc thành công'
          });
        } else {
          this.messageService.add({
            severity: 'warn',
            summary: 'Đã tồn tại',
            detail: 'Việc đã được lưu rồi, vui lòng xem trong danh sách yêu thích'
          });
        }
      });
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Lưu việc thất bại',
        detail: 'Vui lòng đăng nhập để lưu việc'
      });
    }
  }
  splitSkills(skills: string): string[] {
    return skills ? skills.split(',').map(skill => skill.trim()) : [];
}
}
