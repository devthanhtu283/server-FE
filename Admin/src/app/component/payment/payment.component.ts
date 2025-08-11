import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, Subject, Subscription } from 'rxjs';

import { MessageService } from 'primeng/api';
import { BaseUrl } from 'src/app/service/baseUrl.service';
import { UserService } from 'src/app/service/user.service';
import { JobService } from 'src/app/service/job.service';
import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Đăng ký thành phần sử dụng
Chart.register(
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend
);


@Component({
  selector: 'app-payment',
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.css'],
})
export class PaymentComponent implements OnInit, OnDestroy {
  payments: any[] = [];
  searchQuery = '';
  searchSubject = new Subject<string>();
  searchSubscription: Subscription | undefined;
  selectedPaymentType: string | null = null;
  currentUser: any;
  selectedMonth: string | null = null; // ví dụ: "2024-07"

  constructor(
    private paymentService: UserService,
    private router: Router,
    private baseUrl: BaseUrl,
    private messageService: MessageService,
    private jobService: JobService
  ) {}

  ngOnInit() {
    // Get current user (admin) from localStorage
    this.currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (!this.currentUser || !this.currentUser.id) {
      this.router.navigate(['/']);
      return;
    }

    this.setupSearch();
    this.fetchPayments();
  }

  ngOnDestroy() {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }

  setupSearch() {
    this.searchSubscription = this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        this.fetchPayments();
      });
  }

  onSearch() {
    this.searchSubject.next(this.searchQuery);
  }

  filterPaymentType(paymentType: string | null) {
    this.selectedPaymentType = paymentType;
    this.fetchPayments();
  }
  onMonthChange() {
    this.fetchPayments();
  }
  
  async fetchPayments() {
    try {
      const response = await this.paymentService.paymentFindAll();
      let payments = response || [];
  
      // Lấy danh sách employerMembership
      const employerMemberships = await this.paymentService.findAllEmployerMembership(0, 1000, true);
      const emMap = new Map<number, number>(); // employerMembershipId → membershipId
      employerMemberships.data.content.forEach((em: any) => {
        if (em.id && em.membershipId) {
          emMap.set(em.id, em.membershipId);
        }
      });
  
      // Gắn membershipId + title vào payments
      payments = await Promise.all(
        payments.map(async (p: any) => {
          const employerMembershipId = p.employerMembershipId;
          if (employerMembershipId && emMap.has(employerMembershipId)) {
            const membershipId = emMap.get(employerMembershipId);
            try {
              const membership = await this.jobService.membershipFindById(membershipId);
              p.membershipId = membershipId;
              p.membershipTitle = membership.name || 'N/A';
              p.typeFor = membership.typeFor;
            } catch {
              p.membershipTitle = 'Lỗi lấy gói';
            }
          } else {
            p.membershipTitle = 'Không có gói';
          }
          return p;
        })
      );
  
      // Lọc theo tìm kiếm
      if (this.searchQuery) {
        const keyword = this.searchQuery.toLowerCase();
        payments = payments.filter((p: any) =>
          p.description?.toLowerCase().includes(keyword) ||
          p.amount?.toString().includes(keyword) ||
          p.transactionId?.toString().includes(keyword) ||
          p.membershipTitle?.toLowerCase().includes(keyword)
        );
      }
  
      // Lọc theo tháng
      if (this.selectedMonth) {
        const [yearStr, monthStr] = this.selectedMonth.split('-');
        const year = parseInt(yearStr, 10);
        const month = parseInt(monthStr, 10);
  
        payments = payments.filter((p: any) => {
          const paymentDate = new Date(p.time);
          return (
            paymentDate.getFullYear() === year &&
            paymentDate.getMonth() + 1 === month
          );
        });
      }
  
      this.payments = payments;
  
      // Lấy toàn bộ membership để đảm bảo chart đầy đủ
      const allMemberships = await this.jobService.membershipFindAll(); // giả sử trả về [{id, name}]
      const groupedData = new Map<string, number>();
  
      for (const m of allMemberships) {
        groupedData.set(m.name || 'Không xác định', 0); // mặc định 0
      }
  
      for (const p of this.payments) {
        const title = p.membershipTitle || 'Không xác định';
        const current = groupedData.get(title) || 0;
        groupedData.set(title, current + Number(p.amount || 0));
      }
  
      // Chuẩn bị dữ liệu
      const labels = Array.from(groupedData.keys());
      const values = Array.from(groupedData.values());
  
      // Huỷ chart cũ
      const existingChart = Chart.getChart("paymentChart");
      if (existingChart) existingChart.destroy();
  
      // Vẽ chart mới
      const ctx = document.getElementById('paymentChart') as HTMLCanvasElement;
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Tổng tiền theo gói',
            backgroundColor: 'orange',
            data: values
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false },
            title: {
              display: true,
              text: 'Tổng tiền theo gói (membership)',
              font: { size: 16 }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function (value: any) {
                  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                }
              }
            }
          }
        }
      });
  
    } catch (err) {
      console.error('❌ Fetch payments failed:', err);
      this.messageService.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Tải danh sách thanh toán thất bại.'
      });
    }
  }
  
  
}