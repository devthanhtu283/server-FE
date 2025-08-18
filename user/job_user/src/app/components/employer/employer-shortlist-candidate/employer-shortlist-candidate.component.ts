import { ChangeDetectorRef, Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { Application } from "src/app/models/application.model";
import { Employee, User } from 'src/app/models/user.model';
import { ApplicationService } from "src/app/services/application.service";
import { UserService } from "src/app/services/user.service";
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Job } from "src/app/models/job.model";
import { JobService } from "src/app/services/job.service";

@Component({
    templateUrl: "./employer-shortlist-candidate.component.html",
    styleUrls: ['./employer-shortlist-candidate.component.css'],
  })
export class EmployerShortListCandidateComponent implements OnInit {

  applications: Application[];
  applicationId: number;
  currentPage: number = 0;
  totalPages : number;
  pageSize : number;
  showAppointmentForm: boolean = false;
  eventForm: FormGroup;
  meetLink: string | null = null;
  authUrl: string = '';
  eventData: any = null; // Lưu sự kiện tạm thời trước khi xác thực

  constructor(
    private userService: UserService,
    private applicationService: ApplicationService,
    private jobService: JobService,
    private router: Router,
    private formBuilder: FormBuilder,
    private http: HttpClient
  ) {
    this.eventForm = this.formBuilder.group({
      summary: ['', Validators.required],
      location: ['Online'],
      description: ['', Validators.required],
      startDateTime: ['', Validators.required],
      endDateTime: ['', Validators.required]
    });
  }
  user: User;
  employee: Employee;
  application: Application;
  job: Job;
  ngOnInit(): void {
    const user = JSON.parse(localStorage.getItem('user'));
    const employer = JSON.parse(localStorage.getItem('employer'));
    if (!user) {
      this.router.navigate(['/']); // Điều hướng lại nếu không tìm thấy user
    } else {
      this.user = user; // Gán dữ liệu người dùng
      this.employee = employer;
      this.loadData();
    }

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

  loadData(): void {
    this.applicationService.findByEmployerId(this.user.id, this.currentPage, 2).then(
      (res) => {
        this.applications = res["data"]["content"];
        this.totalPages = res["data"]["totalPages"];
        this.pageSize = res["data"]["size"];
      }
    );
    
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

  toggleAppointmentForm(applicationId: number) {
    this.showAppointmentForm = !this.showAppointmentForm;
    this.applicationId = applicationId; // Lưu applicationId vào biến class
    localStorage.setItem('applicationId', applicationId.toString()); // Lưu vào localStorage
  }

  prepareEventCreation() {
    if (this.eventForm.valid) {
        const eventData = this.eventForm.value;
        console.log(eventData);
        // 🔹 Lưu dữ liệu sự kiện vào Backend trước khi xác thực
        this.applicationService.saveEventData(eventData).then(() => {
            // 🔹 Kiểm tra xem đã xác thực chưa
            this.applicationService.checkAuth().then((isAuthenticated) => {
                if (isAuthenticated) {
                    // Nếu đã xác thực, tạo sự kiện luôn
                    this.createEvent();
                } else {
                    // Nếu chưa, chuyển hướng đến Google để xác thực
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
                                    Thư Mời Phỏng Vấn - ${this.employee['data']['companyName']}
                                  </div>
                                  <div style="padding: 20px; color: #333;">
                                    <p>Xin chào <strong>${this.user.username}</strong>,</p>
                                    <p>Chúc mừng! Nhà tuyển dụng <strong>${this.employee['data']['companyName']}</strong> đã xem hồ sơ của bạn và muốn mời bạn tham gia phỏng vấn.</p>
                              
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
  const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',  // Hiển thị thứ
      day: '2-digit',
      month: 'long',  // Hiển thị tháng dưới dạng chữ
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false, // Sử dụng định dạng 24 giờ (nếu muốn AM/PM, đặt thành `true`)
      timeZoneName: 'short' // Hiển thị múi giờ (nếu cần)
  };
  
  return new Date(dateTime).toLocaleDateString('vi-VN', options);
}


}