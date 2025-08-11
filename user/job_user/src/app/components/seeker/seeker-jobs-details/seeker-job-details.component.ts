import { DatePipe } from "@angular/common";
import { ChangeDetectorRef, Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { MessageService } from "primeng/api";
import { Job } from "src/app/models/job.model";
import { User } from 'src/app/models/user.model';
import { ApplicationService } from "src/app/services/application.service";
import { BaseUrl } from "src/app/services/baseUrl.service";
import { JobService } from "src/app/services/job.service";
import { UserService } from "src/app/services/user.service";
import { WebSocketService } from "src/app/services/webSocket.service";

@Component({
    templateUrl: "./seeker-job-details.component.html",
    styleUrls: ['./seeker-job-details.component.css'],
})
export class SeekerJobDetailsComponent implements OnInit {
  jobId: any;
  job: Job;
  jobs: Job[] = [];
  user: User;
  result: any;
  applied: boolean = false;
  isApplied: boolean = false;
  appliedOverThreeTimes: boolean = false;
  imgBaseUrl: string;
  cvDialogVisible: boolean = false;
  selectedFile: File | null = null;
  fileBaseUrl: string;
  userMembership: any = null;
  currentPlan: any = null;
  plans: any[] = [];
  userCVUrl: string | null = null;
  constructor(
    private userService: UserService,
    private applicationService: ApplicationService,
    private messageService: MessageService,
    private datePipe: DatePipe,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private jobService: JobService,
    private baseUrl: BaseUrl,
    private webSocketService: WebSocketService
  ) {}

  ngOnInit(): void {
    this.user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
    this.imgBaseUrl = this.baseUrl.getUserImageUrl();
    this.fileBaseUrl = this.baseUrl.getUserFileUrl();
    // Lắng nghe sự thay đổi của param 'id'
    this.route.params.subscribe(params => {
      this.jobId = params['id'];
      console.log('Job ID:', this.jobId);

      // Gọi API để lấy thông tin công việc theo id
      this.loadJobDetails();
    });

    // Lấy danh sách tất cả các công việc
    this.loadAllJobs();
    this.loadUserMembership();
    this.applicationService.countApply(this.user.id, this.jobId).then(
      (res) => {
        console.log(res.data);
        if(res.data) {
          this.isApplied = true;
        } else {
          this.isApplied = false;
        }
        if(res.data == 3) {
          this.appliedOverThreeTimes = true;
        } 
      }
    )
  }

  loadUserMembership(): void {
      if (this.user && this.user.id) {
          this.userService.findEmployerMembershipByUserId(this.user.id)
              .then(response => {
                  this.userMembership = response;
                  console.log(this.userMembership);
                  if (this.userMembership && this.userMembership.membershipId) {
                      this.currentPlan = this.plans.find(plan => plan.id === this.userMembership.membershipId);
                  }
                  this.cdr.detectChanges();
              })
              .catch(error => {
                  console.error('Error loading user membership:', error);
              
              });
      }
  }

  // Hàm tải thông tin công việc chi tiết
  loadJobDetails(): void {
    this.jobService.findById(Number.parseInt(this.jobId)).then(
      res => {
        console.log('Job Details:', res);
        this.job = res;
      },
      err => {
        console.error('Error loading job details:', err);
      }
    );
  }

  // Hàm tải tất cả công việc
  loadAllJobs(): void {
    this.jobService.findAll().then(
      res => {
        console.log('All Jobs:', res);
        this.jobs = res;
      },
      err => {
        console.error('Error loading jobs:', err);
      }
    );
  }

  async applyJob(): Promise<boolean> {
    const application = {
      jobId: this.jobId,
      seekerId: this.user.id,
      status: 0,
      appliedAt: this.datePipe.transform(new Date(), 'dd/MM/yyyy HH:mm:ss'),
    };
  
    try {
      const res = await this.applicationService.save(application);
      this.result = res.data;
      this.isApplied = true;
      this.applied = true;
  
      if (this.result === 3) {
        this.appliedOverThreeTimes = true;
        this.messageService.add({
          severity: 'warn',
          summary: 'Không được ứng tuyển công việc này',
          detail: 'Bạn đã ứng tuyển quá 3 lần nên không được phép ứng tuyển nữa !!'
        });
        return false;
      }
  
      // ✅ Gửi thông báo thành công
      this.messageService.add({
        severity: 'success',
        summary: 'Ứng tuyển thành công',
        detail: 'Bạn đã ứng tuyển thành công công việc này !! Sẽ có phản hồi sớm từ nhà tuyển dụng nhé.'
      });
  
      // ✅ Gửi email
      const emailContent = `
        <div style="max-width: 600px; margin: 20px auto; font-family: Arial, sans-serif; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
          <div style="background-color: #28a745; color: white; padding: 20px; text-align: center; font-size: 20px; font-weight: bold;">
            Chúc mừng! Bạn đã ứng tuyển thành công!
          </div>
          <div style="padding: 20px; color: #333;">
            <p>Xin chào <strong>${this.user.username}</strong>,</p>
            <p>Chúng tôi vui mừng thông báo rằng bạn đã hoàn thành ứng tuyển thành công cho công việc <strong>${this.job.title}</strong>.</p>
            <p>Dưới đây là thông tin chi tiết về công việc mà bạn đã ứng tuyển:</p>
            <div style="background: #f8f9fa; padding: 15px; border-left: 4px solid #28a745; margin: 15px 0;">
              <p><strong>Công việc:</strong> ${this.job.title}</p>
              <p><strong>Vị trí:</strong> ${this.job.address}</p>
              <p><strong>Mức lương:</strong> ${this.job.salary}</p>
            </div>
            <p>Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất. Để kiểm tra lại thông tin công việc hoặc cập nhật hồ sơ, bạn có thể nhấn vào liên kết dưới đây:</p>
            <p style="text-align: center; margin: 20px 0;">
              <a href="http://103.153.68.231:4200/seeker/job-details/${this.job.id}" 
                style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Xem chi tiết công việc
              </a>
            </p>
            <p>Chúc bạn may mắn trong quá trình ứng tuyển và hy vọng bạn sẽ có cơ hội hợp tác cùng công ty!</p>
            <p>Trân trọng,<br>Đội ngũ tuyển dụng</p>
          </div>
          <div style="background-color: #f1f1f1; text-align: center; padding: 10px; font-size: 12px; color: #666;">
            Đây là email tự động, vui lòng không trả lời.
          </div>
        </div>
      `;
  
      const email = {
        from: 'truongvanhuong221196@gmail.com',
        to: this.user.email,
        subject: 'Xác thực tài khoản',
        content: emailContent,
      };
  
      await this.userService.sendEmail(email);
      return true;
  
    } catch (err) {
      console.error("Lỗi khi ứng tuyển:", err);
      return false;
    }
  }
  

  openCVModal(): void {
    if (!this.user) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Ứng tuyển thất bại',
        detail: 'Vui lòng đăng nhập để ứng tuyển'
      });
      return;
    }
    if (this.userMembership?.status) {
      this.userService.findCVBySeekerId(this.user.id).then(
        (res) => {
          this.userCVUrl = res.name || null;
        }
      )
    } else {
      this.userCVUrl = null; // Không có CV
    }
    this.cvDialogVisible = true;
  }
  
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    this.selectedFile = file ? file : null;
  }

  uploadCV(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
  
    return new Promise((resolve, reject) => {
      this.userService.applyCV(formData).then(
        (res) => {
          resolve(res['data']);
        },
        (err) => {
          reject(err);
        }
      );
    });
  }
  
  
  
  
  async submitApplication(): Promise<void> {
    if (this.appliedOverThreeTimes) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Ứng tuyển thất bại',
        detail: 'Bạn đã ứng tuyển công việc này quá 3 lần nên không thể ứng tuyển nữa.'
      });
      return;
    }
  
    this.cvDialogVisible = false;
  
    try {
      let fileUrl: string;
  
      if (this.selectedFile) {
        // Trường hợp người dùng upload file mới
        fileUrl = await this.uploadCV(this.selectedFile);
      } else if (this.userCVUrl) {
        // Trường hợp dùng lại CV đã upload trước đó
        fileUrl = this.fileBaseUrl + this.userCVUrl;
      } else {
        // Không có file mới, không có file cũ
        this.messageService.add({
          severity: 'warn',
          summary: 'Thiếu CV',
          detail: 'Vui lòng tải lên CV để ứng tuyển.'
        });
        return;
      }
  
      const applySuccess = await this.applyJob();
      if (!applySuccess) return;
  
      const chatMessage = {
        senderId: this.user.id,
        senderRole: this.user.userType === 1 ? 'SEEKER' : 'EMPLOYER',
        receiverId: this.job?.employerId,
        receiverRole: 'EMPLOYER',
        message: `Ứng viên đã ứng tuyển công việc <strong>${this.job.title}</strong>. Đây là CV của Ứng viên: <a href="${fileUrl}" target="_blank">Xem CV</a>`,
        time: new Date(),
        status: 1
      };
  
      this.userService.sendMessage(chatMessage).then(
        () => {
          this.messageService.add({
            severity: 'success',
            summary: 'CV đã gửi',
            detail: 'CV đã được gửi tới nhà tuyển dụng thông qua tin nhắn.'
          });
        },
        (error) => {
          console.error('Lỗi gửi message:', error);
          this.messageService.add({
            severity: 'warn',
            summary: 'Không gửi được tin nhắn',
            detail: 'Ứng tuyển thành công nhưng gửi message thất bại.'
          });
        }
      );
  
    } catch (err) {
      console.error('Lỗi khi upload hoặc gửi:', err);
      this.messageService.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể upload hoặc gửi CV.'
      });
    }
  }
  
  
  

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }
  
  onDrop(event: DragEvent): void {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  splitSkills(skills: string): string[] {
    return skills ? skills.split(',').map(skill => skill.trim()) : [];
  }
}

