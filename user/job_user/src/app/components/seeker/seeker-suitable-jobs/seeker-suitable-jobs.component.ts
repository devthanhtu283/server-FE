import { ChangeDetectorRef, Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { MessageService } from "primeng/api";
import { Subject } from "rxjs";
import { Category, Experience, Location, JobMatch, Worktype } from "src/app/models/job.model";
import { User } from 'src/app/models/user.model';
import { BaseUrl } from "src/app/services/baseUrl.service";
import { JobService } from "src/app/services/job.service";
import { UserService } from "src/app/services/user.service";
import { debounceTime } from 'rxjs/operators';


@Component({
    templateUrl: "./seeker-suitable-jobs.component.html",
    styleUrls: ["./seeker-suitable-jobs.component.css"],

  })
export class SeekerSuitableJobsComponent implements OnInit {

  jobs: JobMatch[] = [];
  currentPage: number = 1;
  totalPages: number;
  pageSize: number;
  totalJobs: number = 0;
  imgBaseUrl: string;
  isSearchingBar: boolean = false; // Trạng thái tìm kiếm cho thanh TopCV
  isSearchingForm: boolean = false; // Trạng thái tìm kiếm cho khung chi tiết
  locations: Location[] = [];
  worktypes: Worktype[] = [];
  experiences: Experience[] = [];
  categories: Category[] = [];
  searchForm: FormGroup;
  seekerId: number | null = null;
  readonly pageWindow = 6;
  
    // Biến cho thanh tìm kiếm TopCV
  searchTitle: string = '';
  selectedLocationId: number | null = null;
  selectedCategoryId: number | null = null;
  private searchSubject = new Subject<void>();

  constructor(
    private userService: UserService,
    private router: Router,
    private changeDetectorRef: ChangeDetectorRef,
    private jobService: JobService,
    private baseUrl: BaseUrl,
    private messageService: MessageService,
    private fb: FormBuilder,
  ) {}
  user: User;
  ngOnInit(): void {

  
    this.imgBaseUrl = this.baseUrl.getUserImageUrl();
  
    // Lấy seekerId an toàn từ localStorage (hỗ trợ cả candidate.id lẫn candidate.data.id)
    try {
      const seekerRaw = localStorage.getItem('candidate');
      if (seekerRaw) {
        const seekerObj = JSON.parse(seekerRaw);
        this.seekerId = seekerObj?.id ?? seekerObj?.data?.id ?? null;
      }
    } catch (e) {
      this.seekerId = null;
    }
  
    // Lấy user (không điều hướng vô điều kiện)
    try {
      const userRaw = localStorage.getItem('user');
      this.user = userRaw ? JSON.parse(userRaw) : null;
    } catch (e) {
      this.user = null;
    }
  
    // Khởi tạo form
    this.searchForm = this.fb.group({
      title: [''],
      locationId: [null],
      worktypeId: [null],
      experienceId: [null],
      categoryId: [null],
    });
  
    // Load dropdowns
    this.jobService.locationFindAll().then((res) => {
      this.locations = (res || []).filter((x: any) => x.status === true);
      this.changeDetectorRef.detectChanges();
    }).catch(err => console.error('[ngOnInit] locationFindAll error:', err));
  
    this.jobService.worktypeFindAll().then((res) => {
      this.worktypes = (res || []).filter((x: any) => x.status === true);
      this.changeDetectorRef.detectChanges();
    }).catch(err => console.error('[ngOnInit] worktypeFindAll error:', err));
  
    this.jobService.categoryFindAll().then((res) => {
      this.categories = (res || []).filter((x: any) => x.status === 1);
      this.changeDetectorRef.detectChanges();
    }).catch(err => console.error('[ngOnInit] categoryFindAll error:', err));
  
    this.jobService.experienceFindAll().then((res) => {
      this.experiences = (res || []).filter((x: any) => x.status === true);
      this.changeDetectorRef.detectChanges();
    }).catch(err => console.error('[ngOnInit] experienceFindAll error:', err));
  
    // Debounce tìm kiếm TopCV
    this.searchSubject.pipe(debounceTime(300)).subscribe(() => {
      console.log('[ngOnInit] debounce -> searchBarJobs');
      this.searchBarJobs(this.currentPage);
    });

    this.loadJobs(this.currentPage);

  }
  
  
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
      const seeker = JSON.parse(localStorage.getItem('candidate'));
      console.log(seeker["data"]['id']);
      this.jobService.getRecommendJobsBySeekerId(seeker["data"]['id'], this.currentPage - 1).then(
        (res) => {
          this.jobs = res["data"]["content"];
          this.totalPages = res["data"]["totalPages"];
          this.pageSize = res["data"]["size"];
          this.totalJobs = res["data"]["totalElements"];
          console.log(this.jobs);
          // Kiểm tra trạng thái yêu thích
          this.jobs.forEach((job) => {
            if (!this.seekerId) {
              job.checkFavorited = false;
            } else {
              this.jobService.favoriteCheckExists(job.jobId, this.seekerId).then((favoriteRes) => {
                job.checkFavorited = favoriteRes.status;
                console.log(job.checkFavorited);
                this.changeDetectorRef.detectChanges();
              }).catch((err) => {
                console.error(`Error checking favorite status for job ${job.id}:`, err);
                job.checkFavorited = false; // Đặt mặc định là false nếu có lỗi
              });
            }
          });
        },
        (err) => {
          console.error('Error loading jobs:', err);
          this.jobs = [];
        }
      );
    }
  }

  // Hàm tìm kiếm cho thanh TopCV
  searchBarJobs(page: number = 0): void {
    this.isSearchingBar = true;
    this.isSearchingForm = false; // Đặt lại trạng thái tìm kiếm của khung chi tiết

    // Kiểm tra nếu không có giá trị tìm kiếm nào
    if (!this.searchTitle && !this.selectedLocationId && !this.selectedCategoryId) {
      this.isSearchingBar = false;
      this.loadJobs(page);
      return;
    }

    // Gọi API tìm kiếm
    this.jobService.searchRecommendJobs(
      this.seekerId,
      this.searchTitle,
      this.selectedLocationId,
      this.selectedCategoryId,
      page,
      5
    ).subscribe({
      next: (res) => {
        this.jobs = res.content;
        this.totalPages = res.totalPages;
        this.totalJobs = res.totalElements;
        this.currentPage = page;

        // Kiểm tra trạng thái yêu thích
        this.jobs.forEach((job) => {
          if (!this.seekerId) {
            job.checkFavorited = false;
          } else {
            this.jobService.favoriteCheckExists(job.jobId, this.seekerId).then((res) => {
              job.checkFavorited = res.status;
              this.changeDetectorRef.detectChanges();
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
  searchJobs(page: number): void {
    page = this.currentPage;
    this.isSearchingForm = true;
    this.isSearchingBar = false; // Đặt lại trạng thái tìm kiếm của thanh TopCV

    const searchParams = this.searchForm.value;

    // Kiểm tra nếu không có giá trị tìm kiếm nào
    if (!searchParams.title && !searchParams.locationId && !searchParams.worktypeId && !searchParams.experienceId && !searchParams.categoryId) {
      this.isSearchingForm = false;
      this.loadJobs(page);
      return;
    }
    console.log(page);
    // Gọi API tìm kiếm
    this.jobService.searchRecommendJobs(
      this.seekerId,
      searchParams.title || '',
      searchParams.locationId || null,
      searchParams.worktypeId || null,
      searchParams.experienceId || null,
      searchParams.categoryId || null,
      page,
      5
    ).subscribe({
      next: (res) => {
        const data = res["data"];
        this.jobs = data["content"];
        this.pageSize = data["size"];
        this.totalPages = data["totalPages"];
        this.totalJobs = data["totalElements"];
        this.currentPage = page;

        // Kiểm tra trạng thái yêu thích
        this.jobs.forEach((job) => {
          if (!this.seekerId) {
            job.checkFavorited = false;
          } else {
            this.jobService.favoriteCheckExists(job.jobId, this.seekerId).then((favoriteRes) => {
              job.checkFavorited = favoriteRes.status;
              this.changeDetectorRef.detectChanges();
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
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.loadJobs(this.currentPage);
    }
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

  // Hàm hiển thị khoảng công việc
  getJobRange(): string {
    const jobCount = this.totalJobs;
  
    if (this.totalJobs === 0) {
      return `Không có kết quả nào`;
    }
  
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
          // Cập nhật trực tiếp trạng thái checkFavorited
          const job = this.jobs.find((job) => job.jobId === jobId);
          if (job) {
            job.checkFavorited = true;
          }
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