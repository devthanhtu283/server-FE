import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { DatePipe } from '@angular/common';
import {
  Application,
  ApplicationUpdateStatus,
} from 'src/app/models/application.model';
import { Job } from 'src/app/models/job.model';
import { User, Employee, Seeker } from 'src/app/models/user.model';
import { ApplicationService } from 'src/app/services/application.service';
import { JobService } from 'src/app/services/job.service';
import { UserService } from 'src/app/services/user.service';
import { QuizService } from 'src/app/services/quiz.service';
import { MessageService } from 'primeng/api';
import { TestHistoryService } from 'src/app/services/testHistory.service';
import { BaseUrl } from 'src/app/services/baseUrl.service';

@Component({
  templateUrl: './employer-list-candidate.component.html',
  styleUrls: ['./employer-list-candidate.component.css'],
})
export class EmployerListCandidateComponent implements OnInit {
  applications: Application[] = [];
  totalApplications: number;
  currentPage: number = 0;
  totalPages: number;
  pageSize: number;
  status: number;
  applicationId: number;
  eventForm: FormGroup;
  meetLink: string | null = null;
  showAppointmentForm: boolean = false;
  authUrl: string = '';
  applicationUpdated: ApplicationUpdateStatus;
  totalRejected: number;
  fileBaseUrl: string;
  userCVUrl: string | null = null;
  user: User;
  employee: Employee;
  seeker: Seeker;
  application: Application;
  job: Job;
  searchControl = new FormControl('');
  searchForm = new FormGroup({
    searchQuery: new FormControl(''),
    searchType: new FormControl('job'),
  });

  // Properties for test selection modal
  tests: any[] = [];
  selectedTestId: number | null = null;
  selectedApplication: Application | null = null;
  showModal: boolean = false;
  eventData: any = null;

  constructor(
    private applicationService: ApplicationService,
    private router: Router,
    private userService: UserService,
    private jobService: JobService,
    private fb: FormBuilder,
    private quizService: QuizService,
    private messageService: MessageService,
    private testHistoryService: TestHistoryService,
    private formBuilder: FormBuilder,
    private baseUrl: BaseUrl,
    private datePipe: DatePipe,
    private cdr: ChangeDetectorRef // Thêm ChangeDetectorRef để cập nhật giao diện
  ) {
    this.eventForm = this.formBuilder.group({
          summary: ['', Validators.required],
          location: ['Online'],
          description: ['', Validators.required],
          startDateTime: ['', Validators.required],
          endDateTime: ['', Validators.required]
        });
  }

  ngOnInit(): void {
    const user = JSON.parse(localStorage.getItem('user'));
    const employer = JSON.parse(localStorage.getItem('employer'));
    this.fileBaseUrl = this.baseUrl.getUserFileUrl();
    if (!user) {
      this.router.navigate(['/']);
    } else {
      this.user = user;
      this.employee = employer;
      this.status = 0;
      this.loadData();
    }
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((query) => this.applicationService.search(query))
    ).subscribe();

    this.applicationService.authUrl().then(
      (res) => {
        this.authUrl =  res.authUrl;
      }
    )

     // 🔹 Lấy applicationId từ localStorage nếu có
     const storedApplicationId = localStorage.getItem('applicationId');
     if (storedApplicationId) {
         this.applicationId = parseInt(storedApplicationId); // Ép kiểu về số
         console.log("📌 ApplicationId lấy từ localStorage:", this.applicationId);
     } else {
      console.warn("⚠️ Không tìm thấy applicationId trong localStorage!");
  }

     console.log(this.applicationId);

     // 🔹 Xử lý callback OAuth (nếu có `code`)
     this.handleOAuthCallback();

     const urlParams = new URLSearchParams(window.location.search);
     const authSuccess = urlParams.get('authSuccess');

    if (authSuccess) {
      alert("Xác thực Google thành công! Giờ đang tạo sự kiện...");

      // 🔹 Lấy dữ liệu sự kiện từ localStorage
      const eventDataString = localStorage.getItem("eventData");
      if (eventDataString) {
        this.eventData = JSON.parse(eventDataString);
        localStorage.removeItem("eventData"); // Xóa dữ liệu sau khi dùng

        // 🔹 Tự động gọi createEvent() để tạo Google Meet
        this.createEvent();
      } else {
        alert("Không tìm thấy dữ liệu sự kiện. Vui lòng thử lại!");
      }

      // Xóa query params khỏi URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }

  filterByStatus(status: number): void {
    // Nếu đổi trạng thái filter, đưa về trang đầu để dữ liệu khớp
    if (this.status !== status) {
      this.currentPage = 0;
    }
    this.status = status;
    this.loadData();
  }
  

  loadData(): void {
    this.applicationService
      .findByEmployerId(this.user.id, this.currentPage, this.status)
      .then((res) => {
        this.applications = res['data']['content'];
        this.totalPages = res['data']['totalPages'];
        this.pageSize = res['data']['size'];
        this.totalApplications = res['data']['totalElements'];
        console.log(res);
        // Kiểm tra test history cho từng application
        this.applications.forEach((app) => {
          this.testHistoryService.findByUserIdAndTestId(app.seekerId).then((testHistory) => {
            console.log(testHistory);
            if (testHistory) {
              app.hasTestHistory = true;
              app.testHistory = {
                id: testHistory.id,
                userID: testHistory.userID,
                testID: testHistory.testID,
                score: testHistory.score,
                contentAnswer: testHistory.contentAnswer,
                timeSubmit: testHistory.timeSubmit ? testHistory.timeSubmit : null, // Hoặc new Date(testHistory.timeSubmit) nếu muốn parse
              };
            } else {
              app.hasTestHistory = false;
              app.testHistory = null;
            }
            this.cdr.detectChanges();
          }).catch((err) => {
            console.error('Lỗi khi kiểm tra testHistory:', err);
            app.hasTestHistory = false;
            app.testHistory = null;
            this.cdr.detectChanges();
          });
        });
        this.applications.forEach((application) => {
          this.userService.findCVBySeekerId(application.seekerId).then(
            (res) => {
              this.userCVUrl = res.name || null;
              console.log(this.userCVUrl);
            }
          )
        });
      });
    this.applicationService
      .findByEmployerId(this.user.id, this.currentPage, 3)
      .then((res) => {
        this.totalRejected = res['data']['totalElements'];
      });
  }

  changePage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.loadData();
    }
  }

  onSearch(currentPage: number = 0): void {
    const query = this.searchForm.value.searchQuery.trim();
    const type = this.searchForm.value.searchType;

    if (!query) return;

    let jobTitle = '';
    let seekerName = '';

    if (type === 'job') {
      jobTitle = query;
    } else {
      seekerName = query;
    }

    this.applicationService
      .search(jobTitle, seekerName, currentPage)
      .then((res) => {
        this.applications = res?.data?.content || [];
        // Kiểm tra test history cho kết quả tìm kiếm
        this.applications.forEach((app) => {
          this.testHistoryService.findByUserIdAndTestId(app.seekerId).then((testHistory) => {
            if (testHistory) {
              app.hasTestHistory = true;
              app.testHistory = {
                id: testHistory.id,
                userID: testHistory.userID,
                testID: testHistory.testID,
                score: testHistory.score,
                contentAnswer: testHistory.contentAnswer,
                timeSubmit: testHistory.timeSubmit ? testHistory.timeSubmit : null, // Hoặc new Date(testHistory.timeSubmit) nếu muốn parse
              };
            } else {
              app.hasTestHistory = false;
              app.testHistory = null;
            }
            this.cdr.detectChanges();
          }).catch((err) => {
            console.error('Lỗi khi kiểm tra testHistory:', err);
            app.hasTestHistory = false;
            app.testHistory = null;
            this.cdr.detectChanges();
          });
        });
      });
  }

  getPages(): number[] {
    const pages = [];
    for (let i = 0; i < this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  // Open modal and load tests
  openTestModal(application: Application): void {
    this.testHistoryService.checkDone(application.seekerId).then((hasHistory) => {
      if (hasHistory) {
        this.messageService.add({
          severity: 'info',
          summary: 'Thông báo',
          detail: 'Đã gửi bài kiểm tra cho ứng viên này.',
        });
        application.hasTestHistory = true; // Cập nhật trạng thái
        this.cdr.detectChanges();
        return;
      }

      // Nếu chưa có test history, mở modal
      this.showModal = true;
      this.selectedApplication = application;
      this.selectedTestId = null;
      this.quizService.getTestsByUserId(this.user.id).then((res) => {
        this.tests = res || [];
        this.cdr.detectChanges();
      });
    });
  }

  // Handle test selection
  selectTest(evt: any): void {
    this.selectedTestId = evt.target.value;
  }

  // Send test email and chat message
  async sendTest(): Promise<void> {
    if (!this.selectedTestId || !this.selectedApplication) return;

    try {
      // Kiểm tra lại test history trước khi gửi
      const hasHistory = await this.testHistoryService.checkDone(this.selectedApplication.seekerId);
      if (hasHistory) {
        this.messageService.add({
          severity: 'info',
          summary: 'Thông báo',
          detail: 'Đã gửi bài kiểm tra cho ứng viên này.',
        });
        this.showModal = false;
        this.selectedApplication.hasTestHistory = true;
        this.cdr.detectChanges();
        return;
      }

      // Fetch test, job, and seeker details
      const test = await this.quizService.getTestById(this.selectedTestId);
      const testCode = test.code || 'TEST-' + this.selectedTestId;
      const job = await this.jobService.findById(this.selectedApplication.jobId);
      const seeker = await this.userService.findById(this.selectedApplication.seekerId);

      const testHistory = {
        userID: this.selectedApplication.seekerId,
        testID: test.id,
        score: null,
        contentAnswer: null,
        timeSubmit: null,
      };

      // Send email
      const emailContent = `
        <div style="max-width: 600px; margin: 20px auto; font-family: Arial, sans-serif; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
          <div style="background-color: #007bff; color: white; padding: 20px; text-align: center; font-size: 20px; font-weight: bold;">
            Bạn nhận được một bài kiểm tra từ ${this.employee['data']['companyName']}!
          </div>
          <div style="padding: 20px; color: #333;">
            <p>Xin chào <strong>${seeker['data'].username}</strong>,</p>
            <p>Chúc mừng bạn đã vượt qua vòng xét duyệt CV cho vị trí <strong>${job.title}</strong> tại <strong>${this.employee['data']['companyName']}</strong>.</p>
            <p>Để tiếp tục quy trình tuyển dụng, vui lòng hoàn thành bài kiểm tra sau:</p>
            <div style="background: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; margin: 15px 0;">
              <p><strong>Mã bài kiểm tra:</strong> ${testCode}</p>
              <p><strong>Công việc:</strong> ${job.title}</p>
              <p><strong>Vị trí:</strong> ${job.address}</p>
            </div>
            <p style="text-align: center; margin: 20px 0;">
              <a href="http://103.153.68.231:4201/" 
                style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Bắt đầu bài kiểm tra
              </a>
            </p>
            <p>Vui lòng hoàn thành bài kiểm tra trong thời gian quy định. Chúc bạn may mắn!</p>
            <p>Trân trọng,<br>Đội ngũ ${this.employee['data']['companyName']}</p>
          </div>
          <div style="background-color: #f1f1f1; text-align: center; padding: 10px; font-size: 12px; color: #666;">
            Đây là email tự động, vui lòng không trả lời.
          </div>
        </div>
      `;

      const email = {
        from: 'truongvanhuong221196@gmail.com',
        to: seeker['data'].email,
        subject: `Bài kiểm tra cho vị trí ${job.title} từ ${this.employee['data']['companyName']}`,
        content: emailContent,
      };

      await this.testHistoryService.save(testHistory);
      await this.userService.sendEmailTest(email);

      // Send chat message
      const chatMessage = {
        senderId: this.user.id,
        senderRole: this.user.userType === 2 ? 'EMPLOYER' : 'SEEKER',
        receiverId: seeker['data'].id,
        receiverRole: 'SEEKER',
        message: `Bạn nhận được một bài kiểm tra cho vị trí <strong>${job.title}</strong> từ <strong>${this.employee['data']['companyName']}</strong>. <br> Mã bài kiểm tra: <strong>${testCode}</strong>. <a href="http://103.153.68.231:4201" target="_blank"> <br>Bắt đầu bài kiểm tra</a>`,
        time: new Date(),
        status: 1,
      };

      await this.userService.sendMessage(chatMessage);

      this.messageService.add({
        severity: 'success',
        summary: 'Bài test đã được gửi',
        detail: 'Đã gửi bài test qua email và tin nhắn cho ứng viên.',
      });

      // Cập nhật trạng thái test history
      this.selectedApplication.hasTestHistory = true;
      this.showModal = false;
      this.loadData(); // Refresh data
      this.cdr.detectChanges();
    } catch (err) {
    
    }
  }

  updateStatus(evt: Event, status: number, applicationId: number): void {
    // evt.preventDefault();
    this.applicationUpdated = {
      id: applicationId,
      status: status,
    };
    this.applicationService
      .updateStatus(this.applicationUpdated)
      .then((res) => {
        this.loadData();
        if (this.applicationUpdated.status == 1) {
          this.applicationService
            .findById(this.applicationUpdated.id)
            .then((res) => {
              this.application = res['data'];
              if (this.application) {
                this.jobService.findById(this.application.jobId).then((res) => {
                  this.job = res;
                  if (this.job) {
                    this.userService
                      .findById(this.application.seekerId)
                      .then((res) => {
                        this.user = res['data'];
                        if (this.user) {
                          const emailContent = `
                            <div style="max-width: 600px; margin: 20px auto; font-family: Arial, sans-serif; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
                              <div style="background-color: #007bff; color: white; padding: 20px; text-align: center; font-size: 20px; font-weight: bold;">
                                Nhà tuyển dụng đã xem hồ sơ của bạn!
                              </div>
                              <div style="padding: 20px; color: #333;">
                                <p>Xin chào <strong>${this.user.username}</strong>,</p>
                                <p>Nhà tuyển dụng <strong>${this.employee['data']['username']}</strong> đã xem hồ sơ của bạn.</p>
                                <p>Hãy kiểm tra thông tin chi tiết về công việc mà bạn đã ứng tuyển:</p>
                                <div style="background: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; margin: 15px 0;">
                                  <p><strong>Công việc:</strong> ${this.job.title}</p>
                                  <p><strong>Vị trí:</strong> ${this.job.address}</p>
                                  <p><strong>Mức lương:</strong> ${this.job.salary}</p>
                                </div>
                                <p style="text-align: center; margin: 20px 0;">
                                  <a href="http://103.153.68.231:4200/seeker/job-details/${this.application.jobId}" 
                                    style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                                    Xem chi tiết công việc
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
                            from: 'truongvanhuong221196@gmail.com',
                            to: this.user.email,
                            subject: 'Nhà tuyển dụng đã xem hồ sơ của bạn',
                            content: emailContent,
                          };
                          this.userService.sendEmail(email).then(
                            (res) => {
                              console.log(res);
                              
                            },
                            (err) => {
                              console.log('Gửi mail không thành công');
                            }
                          );
                        }
                      });
                  }
                });
              }
            });
        }
        if (this.applicationUpdated.status == 2) {
          this.applicationService
            .findById(this.applicationUpdated.id)
            .then((res) => {
              this.application = res['data'];
              if (this.application) {
                this.jobService.findById(this.application.jobId).then((res) => {
                  this.job = res;
                  if (this.job) {
                    this.userService
                      .findById(this.application.seekerId)
                      .then((res) => {
                        this.user = res['data'];
                        if (this.user) {
                          const emailContent = `
                            <div style="max-width: 600px; margin: 20px auto; font-family: Arial, sans-serif; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
                              <div style="background-color: #28a745; color: white; padding: 20px; text-align: center; font-size: 20px; font-weight: bold;">
                                Chúc mừng! Hồ sơ của bạn đã được duyệt!
                              </div>
                              <div style="padding: 20px; color: #333;">
                                <p>Xin chào <strong>${this.user.username}</strong>,</p>
                                <p>Nhà tuyển dụng <strong>${this.employee['data']['username']}</strong> đã duyệt hồ sơ của bạn cho vị trí sau:</p>
                                <div style="background: #f8f9fa; padding: 15px; border-left: 4px solid #28a745; margin: 15px 0;">
                                  <p><strong>Công việc:</strong> ${this.job.title}</p>
                                  <p><strong>Vị trí:</strong> ${this.job.address}</p>
                                  <p><strong>Mức lương:</strong> ${this.job.salary || 'Thỏa thuận'}</p>
                                </div>
                                <p>Hãy chờ phản hồi từ nhà tuyển dụng trong thời gian tới!</p>
                                <p style="text-align: center; margin: 20px 0;">
                                  <a href="http://103.153.68.231:4200/seeker/job-details/${this.application.jobId}" 
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
                            from: 'truongvanhuong221196@gmail.com',
                            to: this.user.email,
                            subject: 'Nhà tuyển dụng đã duyệt hồ sơ của bạn',
                            content: emailContent,
                          };
                          this.userService.sendEmail(email).then(
                            (res) => {
                              console.log(res);
                             
                            },
                            (err) => {
                              console.log('Gửi mail không thành công');
                            }
                          );
                        }
                      });
                  }
                });
              }
            });
        }
        if (this.applicationUpdated.status == 3) {
          this.applicationService
            .findById(this.applicationUpdated.id)
            .then((res) => {
              this.application = res['data'];
              if (this.application) {
                this.jobService.findById(this.application.jobId).then((res) => {
                  this.job = res;
                  if (this.job) {
                    this.userService
                      .findById(this.application.seekerId)
                      .then((res) => {
                        this.user = res['data'];
                        if (this.user) {
                          const emailContent = `
                            <div style="max-width: 600px; margin: 20px auto; font-family: Arial, sans-serif; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
                              <div style="background-color: #dc3545; color: white; padding: 20px; text-align: center; font-size: 20px; font-weight: bold;">
                                Rất tiếc, hồ sơ của bạn chưa phù hợp!
                              </div>
                              <div style="padding: 20px; color: #333;">
                                <p>Xin chào <strong>${this.user.username}</strong>,</p>
                                <p>Chúng tôi rất cảm ơn bạn đã quan tâm đến vị trí <strong>${this.job.title}</strong> tại <strong>${this.employee['data']['username']}</strong>.</p>
                                <p>Tuy nhiên, sau khi xem xét hồ sơ của bạn, nhà tuyển dụng nhận thấy rằng **hồ sơ của bạn chưa phù hợp** với yêu cầu của vị trí này.</p>
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
                            from: 'truongvanhuong221196@gmail.com',
                            to: this.user.email,
                            subject: 'Nhà tuyển dụng đã từ chối hồ sơ của bạn',
                            content: emailContent,
                          };
                          this.userService.sendEmail(email).then(
                            (res) => {
                              console.log(res);
                            },
                            (err) => {
                              console.log('Gửi mail không thành công');
                            }
                          );
                        }
                      });
                  }
                });
              }
            });
        }
      });
      this.messageService.add({
        severity: 'success',
        summary: 'Cập nhật thành công',
        detail: 'Trạng thái đã được cập nhật và email đã gửi.',
      });
  }
  // async updateStatus(evt: Event, status: number, applicationId: number): Promise<void> {
  //   try {
  //     this.applicationUpdated = { id: applicationId, status };
  
  //     await this.applicationService.updateStatus(this.applicationUpdated);
  
  //     const appRes = await this.applicationService.findById(applicationId);
  //     this.application = appRes['data'];
  //     if (!this.application) return;
  
  //     const jobRes = await this.jobService.findById(this.application.jobId);
  //     this.job = jobRes;
  //     if (!this.job) return;
  
  //     const userRes = await this.userService.findById(this.application.seekerId);
  //     this.user = userRes['data'];
  //     if (!this.user) return;
  
  //     const email = {
  //       from: 'truongvanhuong221196@gmail.com',
  //       to: this.user.email,
  //       subject: 'Thông báo trạng thái hồ sơ',
  //       content: this.generateEmailContent(status),
  //     };
  
  //     await this.userService.sendEmail(email);
  //     this.router.navigate(['/employer/list-seeker']);
  //   } catch (error) {
  //     console.error('❌ Lỗi khi cập nhật trạng thái hoặc gửi email:', error);
  //     // TODO: Hiển thị thông báo lỗi UI nếu cần
  //   }
  // }

  // private generateEmailContent(status: number): string {
  //   const company = this.employee['data']['companyName'];
  //   const { username, email } = this.user;
  //   const { title, address, salary } = this.job;
  //   const jobUrl = `http://103.153.68.231:4200/seeker/job-details/${this.application.jobId}`;
  
  //   if (status === 1) {
  //     return `
  //     <div style="max-width: 600px; margin: 20px auto; font-family: Arial, sans-serif; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
  //       <div style="background-color: #007bff; color: white; padding: 20px; text-align: center; font-size: 20px; font-weight: bold;">
  //         Nhà tuyển dụng đã xem hồ sơ của bạn!
  //       </div>
  //       <div style="padding: 20px; color: #333;">
  //         <p>Xin chào <strong>${username}</strong>,</p>
  //         <p>Nhà tuyển dụng <strong>${company}</strong> đã xem hồ sơ của bạn.</p>
  //         <div style="background: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; margin: 15px 0;">
  //           <p><strong>Công việc:</strong> ${title}</p>
  //           <p><strong>Vị trí:</strong> ${address}</p>
  //           <p><strong>Mức lương:</strong> ${salary}</p>
  //         </div>
  //         <p style="text-align: center;">
  //           <a href="${jobUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
  //             Xem chi tiết công việc
  //           </a>
  //         </p>
  //         <p>Chúc bạn sớm tìm được công việc phù hợp!</p>
  //         <p>Trân trọng,<br>Đội ngũ hỗ trợ</p>
  //       </div>
  //       <div style="background-color: #f1f1f1; text-align: center; padding: 10px; font-size: 12px; color: #666;">
  //         Đây là email tự động, vui lòng không trả lời.
  //       </div>
  //     </div>`;
  //   }
  
  //   if (status === 2) {
  //     return `
  //     <div style="max-width: 600px; margin: 20px auto; font-family: Arial, sans-serif; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
  //       <div style="background-color: #28a745; color: white; padding: 20px; text-align: center; font-size: 20px; font-weight: bold;">
  //         Chúc mừng! Hồ sơ của bạn đã được duyệt!
  //       </div>
  //       <div style="padding: 20px; color: #333;">
  //         <p>Xin chào <strong>${username}</strong>,</p>
  //         <p>Nhà tuyển dụng <strong>${company}</strong> đã duyệt hồ sơ của bạn cho vị trí:</p>
  //         <div style="background: #f8f9fa; padding: 15px; border-left: 4px solid #28a745; margin: 15px 0;">
  //           <p><strong>Công việc:</strong> ${title}</p>
  //           <p><strong>Vị trí:</strong> ${address}</p>
  //           <p><strong>Mức lương:</strong> ${salary || 'Thỏa thuận'}</p>
  //         </div>
  //         <p style="text-align: center;">
  //           <a href="${jobUrl}" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
  //             Xem chi tiết công việc
  //           </a>
  //         </p>
  //         <p>Chúc bạn sớm đạt được công việc mong muốn!</p>
  //         <p>Trân trọng,<br>Đội ngũ hỗ trợ</p>
  //       </div>
  //       <div style="background-color: #f1f1f1; text-align: center; padding: 10px; font-size: 12px; color: #666;">
  //         Đây là email tự động, vui lòng không trả lời.
  //       </div>
  //     </div>`;
  //   }
  
  //   if (status === 3) {
  //     return `
  //     <div style="max-width: 600px; margin: 20px auto; font-family: Arial, sans-serif; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
  //       <div style="background-color: #dc3545; color: white; padding: 20px; text-align: center; font-size: 20px; font-weight: bold;">
  //         Rất tiếc, hồ sơ của bạn chưa phù hợp!
  //       </div>
  //       <div style="padding: 20px; color: #333;">
  //         <p>Xin chào <strong>${username}</strong>,</p>
  //         <p>Cảm ơn bạn đã ứng tuyển vào vị trí <strong>${title}</strong> tại <strong>${company}</strong>.</p>
  //         <p>Sau khi xem xét, chúng tôi nhận thấy hồ sơ của bạn chưa thực sự phù hợp với yêu cầu của vị trí này.</p>
  //         <p>Đừng nản lòng! Hãy tiếp tục tìm kiếm các cơ hội khác phù hợp hơn với bạn.</p>
  //         <p style="text-align: center;">
  //           <a href="http://103.153.68.231:4200/seeker/list-jobs" style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
  //             Tìm công việc khác
  //           </a>
  //         </p>
  //         <p>Chúc bạn sớm tìm được công việc phù hợp!</p>
  //         <p>Trân trọng,<br>Đội ngũ hỗ trợ</p>
  //       </div>
  //       <div style="background-color: #f1f1f1; text-align: center; padding: 10px; font-size: 12px; color: #666;">
  //         Đây là email tự động, vui lòng không trả lời.
  //       </div>
  //     </div>`;
  //   }
  
  //   return '';
  // }
 
  toggleAppointmentForm(applicationId: number) {
    this.showAppointmentForm = !this.showAppointmentForm;
    this.applicationId = applicationId; // Lưu applicationId vào biến class
    localStorage.setItem('applicationId', applicationId.toString()); // Lưu vào localStorage
  }
  prepareEventCreation() {
    if (this.eventForm.valid) {
      const raw = this.eventForm.value;
  
      // Convert sang Date object
      const start = new Date(raw.startDateTime);
      const end = new Date(raw.endDateTime);
  
      // Chuẩn hóa về ISO (UTC, có Z ở cuối)
      const eventData = {
        ...raw,
        startDateTime: start.toISOString(),
        endDateTime: end.toISOString()
      };
  
      this.applicationService.saveEventData(eventData).then(() => {
        this.applicationService.checkAuth().then((isAuthenticated) => {
          if (isAuthenticated) {
            this.createEvent();
          } else {
            window.location.href = this.authUrl;
          }
        });
      }).catch(err => {
        alert("❌ Lỗi khi lưu sự kiện trước khi xác thực.");
        console.error(err);
      });
    } else {
      alert("❌ Vui lòng điền đầy đủ thông tin trước khi tạo sự kiện!");
    }
  }
  

handleOAuthCallback() {
  const urlParams = new URLSearchParams(window.location.search);
  const authSuccess = urlParams.get('authSuccess');

  if (authSuccess) {
      alert("✅ Xác thực Google thành công! Đang lấy dữ liệu sự kiện...");

      // 🔹 Lấy lại dữ liệu sự kiện từ Backend
      this.applicationService.getEventData().then((eventData) => {
          if (eventData) {
              console.log("📌 Dữ liệu sự kiện sau xác thực:", eventData);

              // 🔹 Gọi `createEvent()` để tạo Google Meet
              this.createEvent(eventData);
          } else {
              alert("❌ Không tìm thấy dữ liệu sự kiện. Vui lòng thử lại!");
          }
      }).catch(err => {
          console.error("❌ Lỗi khi lấy dữ liệu sự kiện từ Backend:", err);
      });

      // 🔹 Xóa query params khỏi URL
      window.history.replaceState({}, document.title, window.location.pathname);
  }
}

createEvent(eventData?: any) {
  const formattedStartDate = this.formatDateTime(eventData.startDateTime);
  const formattedEndDate = this.formatDateTime(eventData.endDateTime);

  if (!eventData) {
      alert("❌ Không có dữ liệu sự kiện để tạo Google Meet.");
      return;
  }

  console.log("📌 Gửi dữ liệu sự kiện lên backend:", eventData);

  this.applicationService.createMeeting(eventData).then(
      (res) => {
          console.log("🔹 Response từ backend:", res);
          if (res.meetLink) {
              this.meetLink = res.meetLink;
              
              this.applicationService
              .findById(this.applicationId)
              .then((res) => {
                this.application = res['data'];
                console.log(this.applicationId);
                let interview = {
                  applicationId: this.applicationId,
                  scheduledAt: eventData.startDateTime,
                  interviewLink: this.meetLink,
                  status: 1,
                }
                this.applicationService.saveInterview(interview).then(
                  (res) => {
                    console.log("Lưu interview: " + res);
                  }
                )
                // Sau đó đi tìm seeker dựa vào application
                if (this.application) {
                  this.jobService.findById(this.application.jobId).then(
                    (res) => {
                      this.job = res;
                      if(this.job) {
                        this.userService
                        .findById(this.application.seekerId)
                        .then((res) => {
                          this.user = res['data'];
                          if (this.user) {
                            this.applicationService.getEventData().then(
                              (res) => {
                                const emailContent = `
                                <div style="max-width: 600px; margin: 20px auto; font-family: Arial, sans-serif; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
                                  <div style="background-color: #28a745; color: white; padding: 20px; text-align: center; font-size: 20px; font-weight: bold;">
                                    Thư Mời Phỏng Vấn - ${this.employee['data'].username}
                                  </div>
                                  <div style="padding: 20px; color: #333;">
                                    <p>Xin chào <strong>${this.user.username}</strong>,</p>
                                    <p>Chúc mừng! Nhà tuyển dụng <strong>${this.employee['data'].username}</strong> đã xem hồ sơ của bạn và muốn mời bạn tham gia phỏng vấn.</p>
                              
                                    <h3 style="color: #28a745;">📅 Thông tin lịch phỏng vấn:</h3>
                                    <div style="background: #f8f9fa; padding: 15px; border-left: 4px solid #28a745; margin: 15px 0;">
                                      <p><strong>🔹 Vị trí:</strong> ${this.job.title}</p>
                                      <p><strong>📍 Địa điểm:</strong> ${this.job.address} (Hoặc online)</p>
                                      <p><strong>💰 Mức lương:</strong> ${this.job.salary}</p>
                                      <p><strong>⏰ Thời gian:</strong> ${formattedStartDate} - ${formattedEndDate}</p>
                                      <p><strong>📅 Ngày:</strong> ${new Date(res.startDateTime).toLocaleDateString()}</p>
                                    </div>
                              
                                    <h3 style="color: #007bff;">🎥 Tham gia phỏng vấn trực tuyến</h3>
                                    <p>Buổi phỏng vấn sẽ được tổ chức qua Google Meet. Vui lòng nhấp vào đường link dưới đây để tham gia:</p>
                                    <p style="text-align: center; margin: 20px 0;">
                                      <a href="${this.meetLink}" target="_blank" 
                                        style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; font-size: 16px;">
                                        🚀 Tham gia Phỏng vấn
                                      </a>
                                    </p>
                              
                                    <p><strong>📌 Lưu ý:</strong> Vui lòng kiểm tra kết nối internet và chuẩn bị trước các câu hỏi liên quan đến vị trí công việc.</p>
                              
                                    <p>Chúng tôi chúc bạn một buổi phỏng vấn suôn sẻ và thành công! 💪</p>
                                    <p>Trân trọng,<br>Đội ngũ hỗ trợ</p>
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
                                this.userService.sendEmail(email).then(
                                  (res) => {
                                    console.log(res);
                                  },
                                  (err) => {
                                    console.log('Gửi mail không thành công');
                                  }
                                );
                              }
                            )
                           
                          }
                        });
                      }
                    }
                  );
         
                }
              });
             
              alert("🎉 Sự kiện đã được tạo thành công!\nGoogle Meet Link: " + this.meetLink);
          } else {
              alert("❌ Sự kiện đã được tạo nhưng không có Google Meet link.");
          }
      },
      (err) => {
          console.error("🚨 Lỗi khi tạo sự kiện:", err);
      }
  );
}
formatDateTime(dateTime: string): string {
  return this.datePipe.transform(dateTime, "EEEE, dd MMMM yyyy, HH:mm", "Asia/Ho_Chi_Minh")!;
}



}
