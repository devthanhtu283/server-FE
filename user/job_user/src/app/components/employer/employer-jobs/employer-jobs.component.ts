import { Category } from './../../../models/job.model';
import { ChangeDetectorRef, Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { error } from "jquery";
import { MessageService } from "primeng/api";
import { Application } from "src/app/models/application.model";
import { Job } from "src/app/models/job.model";
import { User } from 'src/app/models/user.model';
import { ApplicationService } from "src/app/services/application.service";
import { BaseUrl } from "src/app/services/baseUrl.service";
import { JobService } from "src/app/services/job.service";
import { RecommendationService } from 'src/app/services/recommendation.service';
import { UserService } from "src/app/services/user.service";

@Component({
    templateUrl: "./employer-jobs.component.html",
    styleUrls: ['./employer-jobs.component.css'],
  })
export class EmployerJobsComponent implements OnInit {
  searchKeyword: string = ''; // lưu từ khoá tìm kiếm

  employerId: number;
  currentPage: number = 1;
  totalPages: number = 1;
  totalApplications: number;
  currentApplicationPage: number = 0;
  totalApplicationPages: number;
  readonly pageWindow = 6;
  pageApplicationSize: number;
  jobs: Job[];
  applications: Application[];
  showModal: boolean = false;
  imgBaseUrl: string;
  fileBaseUrl: string;
  visible: boolean = false;
  formData: any = {
    employerId: null,
    experienceId: null,
    locationId: null,
    worktypeId: null,
    categoryId: null,
    employerLogo: '',
    title: '',
    description: '',
    descriptionJson: {
      job_description: {
        overview: '',
        responsibilities: [],
        responsibilities_temp: '',
      },
      benefits: {
        salary_range: '',
        bonus: '',
        additional_benefits: [],
        additional_benefits_temp: '',
      },
      work_hours: '',
      application_method: '',
    },
    required: '',
    address: '',
    salary: null,
    status: true,
    postedAt: new Date(),
    postedExpired: null,
    requiredSkills: '',
    member: 1,
  }; // Dữ liệu form
    // Dữ liệu mẫu cho các dropdown
    locations = [];

    experiences = [];

    worktypes = [];

    categories = [];
  constructor(
    private userService: UserService,
    private router: Router,
    private jobService: JobService,
    private applicationService: ApplicationService,
    private baseUrl: BaseUrl,
    private changeDetectorRef: ChangeDetectorRef,
    private messageService: MessageService,
    private recommendationService: RecommendationService
  ) {}
  user: User;
  ngOnInit(): void {
    this.jobService.locationFindAll().then(
      res => {
        this.locations = res.filter((location: any) => location.status === true);
        console.log(this.locations);
        this.changeDetectorRef.detectChanges();

      }
    );
    this.jobService.worktypeFindAll().then(
      res => {
        this.worktypes = res.filter((worktype: any) => worktype.status === true);
        console.log(this.worktypes);
        this.changeDetectorRef.detectChanges();
      }
    );
    this.jobService.categoryFindAll().then(
      res => {
        this.categories = res.filter((category: any) => category.status === 1);
        console.log(this.categories);
        this.changeDetectorRef.detectChanges();
      }
    );
    this.jobService.experienceFindAll().then(
      res => {
        this.experiences = res.filter((experience: any) => experience.status === true);
        this.changeDetectorRef.detectChanges();
      }
    );
    this.imgBaseUrl = this.baseUrl.getUserImageUrl();
    this.fileBaseUrl = this.baseUrl.getUserFileUrl();
    var employerData = localStorage.getItem('employer');
    var employer = JSON.parse(employerData);
    if(employer != null){
      this.employerId = employer.data.id;
    }
    this.loadJobs(this.currentPage);
  }
  async loadJobs(currentPage: number) {
    try {
      const res = await this.jobService.findByEmployerIdPagination(this.employerId, currentPage);
      this.jobs = res.content;
      this.totalPages = res.totalPages;
      console.log(this.jobs);
      // Lặp qua từng job để lấy số lượng ứng viên apply
      for (let job of this.jobs) {
        try {
          const result = await this.applicationService.countApplicantsByJobId(job.id);

          job.applicantCount = result.data; // Gắn vào từng job
        } catch (err) {
          console.error(`Lỗi khi lấy số lượng ứng viên cho job ${job.id}`, err);
          job.applicantCount = 0; // fallback
        }
      }
    } catch (err) {
      console.error("Lỗi khi load jobs", err);
    }
  }

  async searchByTitle() {
    try {
      const res = await this.jobService.searchByTitle(this.searchKeyword.trim(), this.employerId, this.currentPage);
      this.jobs = res.content;
      this.totalPages = res.totalPages;

      for (let job of this.jobs) {
        try {
          const result = await this.applicationService.countApplicantsByJobId(job.id);
          job.applicantCount = result.data;
        } catch (err) {
          console.error(`Lỗi khi lấy số lượng ứng viên cho job ${job.id}`, err);
          job.applicantCount = 0;
        }
      }
    } catch (err) {
      console.error("Lỗi khi tìm kiếm job theo tiêu đề", err);
    }
  }

  changePage(page: number): void {
    // || page <= this.currentPage
    if (page < 1) return;
    this.currentPage = page;
    this.jobs = [];
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

  addJob() {
    this.visible = true;
    this.resetForm();
  }



  onSave() {
    // Xử lý mô tả chi tiết
    this.formData.descriptionJson.job_description.responsibilities =
      this.formData.descriptionJson.job_description.responsibilities_temp
        .split('\n').filter(item => item.trim() !== '');

    this.formData.descriptionJson.benefits.additional_benefits =
      this.formData.descriptionJson.benefits.additional_benefits_temp
        .split('\n').filter(item => item.trim() !== '');

    // Ghép description từ overview và responsibilities
    const overview = this.formData.descriptionJson.job_description.overview || '';
    const responsibilities = this.formData.descriptionJson.job_description.responsibilities || [];
    const responsibilitiesText = responsibilities.length > 0
      ? '\n\nTrách nhiệm công việc:\n' + responsibilities.map(item => '• ' + item).join('\n')
      : '';

    this.formData.description = overview + responsibilitiesText;

    delete this.formData.descriptionJson.job_description.responsibilities_temp;
    delete this.formData.descriptionJson.benefits.additional_benefits_temp;

    const job = {
      ...this.formData,
      employerId: this.employerId
    };
    job.requiredSkills = job.required_skills;
    job.postedExpired = job.posted_expired;
    console.log(job);
    const isUpdating = !!job.id;
    console.log(isUpdating);
    this.jobService.create(job).then(
      res => {
        if(res.status == null) {
          this.messageService.add({
            severity: 'error',
            summary: 'Thất bại',
            detail: 'Bạn đã hết số lượt để có thể đăng tin tuyển dụng. Vui lòng nâng cấp gói dịch vụ để có thể đăng thêm tin tuyển dụng.',
          });
          return;
        }
        this.messageService.add({
          severity: 'success',
          summary: 'Thành công',
          detail: isUpdating ? 'Cập nhật công việc thành công' : 'Thêm việc thành công',
        });
        console.log(res.status.id);
        this.recommendationService.extractJob(res.status.id);
        // this.userService.findCVBySeekerId(user.id).then()
        // this.recommendationService.recommendationJobs(cv.id).then(
        //   (res) => {
        //     this.messageService.add({
        //       severity: 'success',
        //       summary: 'Thông báo',
        //       detail: 'Hệ thống đã gợi ý các việc làm phù hợp dựa trên kĩ năng của bạn!!',
        //     });
        //   },
        //   (error: any) => {
        //     console.error('Error fetching recommended jobs:', error);
        //     this.messageService.add({
        //       severity: 'error',
        //       summary: 'Lỗi',
        //       detail: 'Không thể lấy danh sách việc làm được gợi ý. Vui lòng thử lại sau.',
        //     });
        //   }
        // )
        this.loadJobs(this.currentPage);
        this.resetForm();
      },
      err => {
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: isUpdating ? 'Cập nhật thất bại' : 'Thêm không thành công',
        });
      }
    );

    this.visible = false;
  }

  stopJob(jobId: number){
    this.jobService.delete(jobId).then(
      res => {
        console.log(res);
        this.messageService.add({
          severity: 'success',
          summary: 'Thành công',
          detail: 'Ngưng tuyển dụng thành công',
        });
        this.loadJobs(this.currentPage);
      },
      error => {
        console.log(error);
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không thành công',
        });
      }
    );
  }

  showApplicants(jobId: number){
    console.log(jobId);
    console.log(this.currentPage);
    this.applicationService.listApplication(jobId, this.currentApplicationPage, 0).then(
      (res) => {
        this.applications = res['data']['content'];
        this.totalApplications = res['data']['totalElements'];
        this.totalApplicationPages = res['data']['totalPages'];
        this.pageApplicationSize = res['data']['size'];
        this.showModal = true;
      }
    )
  }

  resetForm(): void {
    this.formData = {
      title: '',
      description: '',
      descriptionJson: {
        job_description: {
          overview: '',
          responsibilities: [],
          responsibilities_temp: '', // Temporary field for textarea
        },
        benefits: {
          salary_range: '',
          bonus: '',
          additional_benefits: [],
          additional_benefits_temp: '', // Temporary field for textarea
        },
        work_hours: '',
        application_method: '',
      },
      salary: null,
      locationId: null,
      experienceId: null,
      required_skills: '',
      member: 1,
      worktypeId: null,
      categoryId: null,
    };
  }

  closeModal() {
    this.showModal = false;
  }
  viewProfile(applicant: any) {
    window.open(`/seeker/profile/${applicant.seekerId}`, "_blank");
  }

  approveApplicant(application: Application): void {
    const applicationUpdate = {
      id: application.id,
      status: 2, // Trạng thái "Đã duyệt"
    };

    this.applicationService.updateStatus(applicationUpdate).then(
      (res) => {
        // Cập nhật trạng thái trong danh sách ứng viên
        application.status = 2;
        this.applicationService.updateStatus(applicationUpdate).then(
          (res) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Thành công',
              detail: 'Ứng viên đã được duyệt',
            });
            this.showApplicants(application.jobId);
          },
          (err) => {
            console.error('Lỗi khi duyệt ứng viên:', err);
          }
        );
        // Gửi email thông báo cho ứng viên
        this.userService.findById(application.seekerId).then((userRes) => {
          const user = userRes['data'];
          const emailContent = `
            <div style="max-width: 600px; margin: 20px auto; font-family: Arial, sans-serif; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
              <div style="background-color: #28a745; color: white; padding: 20px; text-align: center; font-size: 20px; font-weight: bold;">
                Chúc mừng! Hồ sơ của bạn đã được duyệt!
              </div>
              <div style="padding: 20px; color: #333;">
                <p>Xin chào <strong>${user.username}</strong>,</p>
                <p>Nhà tuyển dụng đã duyệt hồ sơ của bạn cho vị trí <strong>${application.jobTitle}</strong>.</p>
                <p>Hãy chờ phản hồi từ nhà tuyển dụng trong thời gian tới!</p>
                <p style="text-align: center; margin: 20px 0;">
                  <a href="http://103.153.68.231:4200/seeker/job-details/${application.jobId}"
                    style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                    Xem chi tiết công việc
                  </a>
                </p>
                <p>Chúc bạn sớm đạt được công việc mong muốn!</p>
                <p>Trân trọng,<br>Đội ngũ hỗ trợ</p>
              </div>
              <div style="background-color: #f1f1f1; text-align: center; padding: 10px; font-size: 12px; color: #666;">
                Đây là email tự động, vui lòng không trả lời.
              </div>
            </div>
          `;

          const email = {
            from: 'your-email@example.com',
            to: user.email,
            subject: 'Hồ sơ của bạn đã được duyệt!',
            content: emailContent,
          };

          this.userService.sendEmail(email).then(
            () => console.log('Email đã được gửi thành công'),
            () => console.error('Gửi email thất bại')
          );
        });
      },
      (err) => {
        console.error('Cập nhật trạng thái thất bại:', err);
      }
    );
  }

  rejectApplicant(application: Application): void {
    const applicationUpdate = {
      id: application.id,
      status: 3, // Trạng thái "Đã từ chối"
    };

    this.applicationService.updateStatus(applicationUpdate).then(
      (res) => {
        // Cập nhật trạng thái trong danh sách ứng viên
        application.status = 3;
        this.applicationService.updateStatus(applicationUpdate).then(
          (res) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Thành công',
              detail: 'Hồ sơ đã bị từ chối',
            });
            this.showApplicants(application.jobId);
          },
          (err) => {
            console.error('Lỗi khi từ chối ứng viên:', err);
          }
        );

        // Gửi email thông báo cho ứng viên
        this.userService.findById(application.seekerId).then((userRes) => {
          const user = userRes['data'];
          const emailContent = `
            <div style="max-width: 600px; margin: 20px auto; font-family: Arial, sans-serif; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
              <div style="background-color: #dc3545; color: white; padding: 20px; text-align: center; font-size: 20px; font-weight: bold;">
                Rất tiếc, hồ sơ của bạn chưa phù hợp!
              </div>
              <div style="padding: 20px; color: #333;">
                <p>Xin chào <strong>${user.username}</strong>,</p>
                <p>Chúng tôi rất cảm ơn bạn đã quan tâm đến vị trí <strong>${application.jobTitle}</strong>.</p>
                <p>Tuy nhiên, sau khi xem xét hồ sơ của bạn, nhà tuyển dụng nhận thấy rằng hồ sơ của bạn chưa phù hợp với yêu cầu của vị trí này.</p>
                <p>Đừng nản lòng! Hãy tiếp tục khám phá những cơ hội việc làm khác phù hợp với bạn.</p>
                <p style="text-align: center; margin: 20px 0;">
                  <a href="http://103.153.68.231:4200/seeker/list-jobs"
                    style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                    Tìm công việc khác
                  </a>
                </p>
                <p>Chúc bạn sớm tìm được công việc phù hợp!</p>
                <p>Trân trọng,<br>Đội ngũ hỗ trợ</p>
              </div>
              <div style="background-color: #f1f1f1; text-align: center; padding: 10px; font-size: 12px; color: #666;">
                Đây là email tự động, vui lòng không trả lời.
              </div>
            </div>
          `;

          const email = {
            from: 'your-email@example.com',
            to: user.email,
            subject: 'Hồ sơ của bạn chưa phù hợp',
            content: emailContent,
          };

          this.userService.sendEmail(email).then(
            () => console.log('Email đã được gửi thành công'),
            () => console.error('Gửi email thất bại')
          );
        });
      },
      (err) => {
        console.error('Cập nhật trạng thái thất bại:', err);
      }
    );
  }

  editJob(job: Job) {
    this.visible = true; // Mở form
    job.required_skills = job.requiredSkills;
    job.posted_expired = job.postedExpired;

    console.log(job);
    this.formData = {
      ...job,
      posted_expired: job.postedExpired ? new Date(job.postedExpired) : null,

      descriptionJson: {
        ...job.descriptionJson,
        job_description: {
          ...job.descriptionJson.job_description,
          responsibilities_temp: (job.descriptionJson?.job_description?.responsibilities || []).join('\n')
        },
        benefits: {
          ...job.descriptionJson.benefits,
          additional_benefits_temp: (job.descriptionJson?.benefits?.additional_benefits || []).join('\n')
        }
      }
    };
  }

}