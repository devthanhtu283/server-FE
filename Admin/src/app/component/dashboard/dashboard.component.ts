import { Component, OnInit } from '@angular/core';
import { ApplicationService } from 'src/app/service/application.service';
import { JobService } from 'src/app/service/job.service';
import { UserService } from 'src/app/service/user.service';
import {
  Chart,
  LineController,
  PieController,
  LineElement,
  PointElement,
  CategoryScale,
  ArcElement,
  LinearScale,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

Chart.register(
  LineController,
  PieController,
  ArcElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend
);

@Component({
 templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
    totalUser: number;
    totalJob: number;
    totalApplication: number;
    totalEmployerMembership: number;
    totalAmount: number;

    constructor(
      private userService: UserService,
      private jobService: JobService,
      private applicationService: ApplicationService,
    ) {}

    ngOnInit(){
      this.loadUser();
      this.loadJob();
      this.loadApplication();
      this.loadEmployerMembership();
      this.loadTotalAmount();
      this.loadRevenueChart();
      this.loadApplicationStatusChart(); // 👈 Gọi ở đây
      this.loadUserTypeChart(); // ✅ gọi ở đây
      this.loadJobChart();
    }

    loadUser() {
      this.userService.findAll(0,10).then(
        (res) => {
          this.totalUser = res["data"]["totalElements"];
        }
      )
    }

    loadJob() {
      this.jobService.findAllPagination(1).subscribe(
        (res) => {
          this.totalJob = res["totalElements"];
        }
      );
    }

    loadApplication() {
      this.applicationService.findAll().then(
        (res) => {
            this.totalApplication = res["data"].length;
        }
      )
    }

    loadEmployerMembership() {
      this.userService.findAllEmployerMembership(0, 10).then(
        (res) => {
          console.log(res);
          this.totalEmployerMembership = res["data"]["totalElements"];
        }
      )
    }

    loadTotalAmount() {
      this.userService.totalAmount().then(
        (res) => {
          this.totalAmount = res["data"];
        }
      )
    }

    async loadRevenueChart() {
      const payments = await this.userService.paymentFindAll();
      const employerMemberships = await this.userService.findAllEmployerMembership(0, 1000, true);
    
      const emMap = new Map<number, number>();
      employerMemberships.data.content.forEach((em: any) => {
        if (em.id && em.membershipId) {
          emMap.set(em.id, em.membershipId);
        }
      });
    
      // 🎯 Lấy danh sách tất cả membership
      const allMemberships = await this.jobService.membershipFindAll(); // bạn cần viết hoặc sửa hàm này nếu chưa có
      const membershipTitleMap = new Map<number, string>();
      allMemberships.forEach((m: any) => {
        membershipTitleMap.set(m.id, m.name);
      });
    
      // 🎯 Khởi tạo trước tất cả line với 12 số 0
      const dataByMembership = new Map<string, number[]>();
      membershipTitleMap.forEach((title) => {
        dataByMembership.set(title, new Array(12).fill(0));
      });
    
      // 🎯 Gắn membershipId + title vào từng payment
      const enriched = await Promise.all(
        payments.map(async (p: any) => {
          const employerMembershipId = p.employerMembershipId;
          if (employerMembershipId && emMap.has(employerMembershipId)) {
            const membershipId = emMap.get(employerMembershipId);
            const membershipTitle = membershipTitleMap.get(membershipId);
            p.membershipId = membershipId;
            p.membershipTitle = membershipTitle || 'Không xác định';
          }
          return p;
        })
      );
    
      // 🎯 Tính tổng theo tháng
      for (const payment of enriched) {
        const date = new Date(payment.time);
        const month = date.getMonth(); // 0-11
        const title = payment.membershipTitle || 'Không xác định';
        const arr = dataByMembership.get(title);
        if (arr) {
          arr[month] += Number(payment.amount || 0);
        }
      }
    
      // 🎯 Biểu đồ
      const labels = [
        'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
        'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
      ];
    
      const colorPalette = [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
        '#9966FF', '#FF9F40', '#8B0000', '#00BFFF',
        '#228B22', '#FFD700', '#A0522D', '#DC143C'
      ];
    
      let colorIndex = 0;
      const datasets = Array.from(dataByMembership.entries()).map(([label, data]) => {
        const color = colorPalette[colorIndex % colorPalette.length];
        colorIndex++;
    
        return {
          label,
          data,
          fill: false,
          borderColor: color,
          backgroundColor: color,
          tension: 0.3,
          pointRadius: 4,
          pointHoverRadius: 6
        };
      });
    
      const ctx = document.getElementById('revenueChart') as HTMLCanvasElement;
      new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Doanh thu 12 tháng theo gói',
              font: { size: 18 }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: (value: any) =>
                  value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
            }
          }
        }
      });
    }
    

    async loadApplicationStatusChart() {
      const response = await this.applicationService.findAll();
      const applications = response.data || [];
    
      // Khởi tạo 12 tháng cho từng status
      const dataByStatus: { [key: number]: number[] } = {
        0: new Array(12).fill(0), // Mới nộp
        1: new Array(12).fill(0), // Đã xem
        2: new Array(12).fill(0), // Đồng ý
        3: new Array(12).fill(0), // Từ chối
      };
    
      applications.forEach((app: any) => {
        const status = app.status;
        const createdAt = new Date(app.appliedAt); // hoặc app.time nếu khác
        const month = createdAt.getMonth(); // 0-based (Jan = 0)
    
        if (status in dataByStatus) {
          dataByStatus[status][month]++;
        }
      });
    
      const labels = [
        'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
        'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
      ];
    
      const statusLabels = ['Mới nộp', 'Đã xem', 'Đồng ý', 'Từ chối'];
      const statusColors = ['#36A2EB', '#FFCE56', '#4CAF50', '#F44336'];
    
      const datasets = Object.keys(dataByStatus).map((statusKey, index) => ({
        label: statusLabels[+statusKey],
        data: dataByStatus[+statusKey],
        borderColor: statusColors[index],
        backgroundColor: statusColors[index],
        fill: false,
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 6
      }));
    
      // Xoá biểu đồ cũ nếu có
      const existing = Chart.getChart('applicationStatusChart');
      if (existing) existing.destroy();
    
      const ctx = document.getElementById('applicationStatusChart') as HTMLCanvasElement;
      new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Biểu đồ trạng thái ứng tuyển theo tháng',
              font: { size: 18 }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                stepSize: 1
              }
            }
          }
        }
      });
    }
    async loadUserTypeChart() {
      const response = await this.userService.findAll(0, 1000); // lấy nhiều để đủ dữ liệu
      const users = response.data.content || [];
    
      // Đếm theo userType
      let applicantCount = 0;
      let employerCount = 0;
    
      users.forEach((user: any) => {
        if (user.userType === 1) applicantCount++;
        else if (user.userType === 2) employerCount++;
      });
    
      const labels = ['Người ứng tuyển', 'Nhà tuyển dụng'];
      const data = [applicantCount, employerCount];
      const colors = ['#36A2EB', '#FF6384'];
    
      // Xoá chart cũ nếu có
      const existing = Chart.getChart('userTypeChart');
      if (existing) existing.destroy();
    
      const ctx = document.getElementById('userTypeChart') as HTMLCanvasElement;
      new Chart(ctx, {
        type: 'pie',
        data: {
          labels,
          datasets: [{
            data,
            backgroundColor: colors
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Thống kê người dùng theo loại',
              font: { size: 18 }
            },
            legend: {
              position: 'bottom'
            }
          }
        }
      });
    }

    async loadJobChart() {
      const response = await this.jobService.findAll();

      const jobs = response|| [];
 
      // Tạo mảng đếm số bài đăng theo tháng
      const monthlyCount = new Array(12).fill(0);
    
      jobs.forEach((job: any) => {
        const createdAt = new Date(job.postedAt); // field ngày tạo
        const month = createdAt.getMonth(); // tháng 0-11
        monthlyCount[month]++;
      });
    
      const labels = [
        'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
        'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
      ];
    
      // Xoá chart cũ nếu có
      const existing = Chart.getChart('jobChart');
      if (existing) existing.destroy();
    
      const ctx = document.getElementById('jobChart') as HTMLCanvasElement;
      new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'Số lượng bài đăng',
            data: monthlyCount,
            borderColor: '#36A2EB',
            backgroundColor: '#36A2EB',
            tension: 0.3,
            fill: false,
            pointRadius: 4,
            pointHoverRadius: 6
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Thống kê bài đăng theo tháng',
              font: { size: 18 }
            },
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                stepSize: 1
              }
            }
          }
        }
      });
    }
    
    
}
