import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { User } from 'src/app/models/user.model';
import { UserService } from 'src/app/services/user.service';
import { JobService } from 'src/app/services/job.service';
import { MessageService } from 'primeng/api';
import { DatePipe } from '@angular/common';

@Component({
  templateUrl: './employer-pricing.component.html',
  styleUrls: ['./employer-pricing.component.css'],
  providers: [MessageService, DatePipe],
})
export class EmployerPricingComponent implements OnInit {
  user: User | null = null;
  plans: any[] = [];
  monthlyPlans: any[] = [];
  yearlyPlans: any[] = [];
  isMonthly: boolean = true;
  selectedPackage: string = '';
  displayDialog: boolean = false;
  selectedPlan: any = null;
  agreeToTerms: boolean = false;
  userMembership: any = null;
  currentPlan: any = null;
  isRenewal: boolean = false;
  renewalOptions = [
    { label: '1 tháng', value: 1 },
    { label: '6 tháng', value: 6 },
    { label: '1 năm', value: 12 }
  ];
  selectedRenewalMonths: number = 1;

  constructor(
    private userService: UserService,
    private jobService: JobService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private messageService: MessageService,
    public datePipe: DatePipe
  ) {}

  async ngOnInit(): Promise<void> {
    const userData = localStorage.getItem('user');
    if (!userData) {
      this.messageService.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Vui lòng đăng nhập để xem gói cước.',
      });
      this.router.navigate(['/']);
      return;
    }
  
    this.user = JSON.parse(userData);
  
    await this.loadPlans(); // PHẢI load trước
    await this.loadUserMembership(); // sau khi plans đã có
  
    this.route.queryParams.subscribe(params => {
      if (params['vnp_ResponseCode']) {
        this.handlePaymentResult(params);
      }
    });
  }
  
  async loadUserMembership(): Promise<void> {
    if (this.user && this.user.id) {
      try {
        this.userMembership = await this.userService.findEmployerMembershipByUserId(this.user.id);
        if (this.userMembership && this.userMembership.status && this.userMembership.membershipId) {
          this.currentPlan = this.plans.find((plan) => plan.id === this.userMembership.membershipId);
          if (!this.currentPlan) {
            await this.loadPlanDetails(this.userMembership.membershipId);
          }
        } else {
          this.currentPlan = null;
        }
        this.cdr.detectChanges();
      } catch (error) {
        console.error('Error loading user membership:', error);
        this.currentPlan = null;
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không thể tải thông tin gói cước của bạn.',
        });
        this.cdr.detectChanges();
      }
    }
  }
  

  loadPlanDetails(membershipId: number): void {
    this.jobService
      .findByTypeForAndDuration(2, 'MONTHLY')
      .then((monthlyResponse) => {
        this.jobService.findByTypeForAndDuration(2, 'YEARLY').then((yearlyResponse) => {
          const allPlans = [...(monthlyResponse || []), ...(yearlyResponse || [])];
          this.currentPlan = allPlans.find((plan) => plan.id === membershipId);
          this.cdr.detectChanges();
        });
      })
      .catch((error) => {
        console.error('Error loading plan details:', error);
      });
  }

  async loadPlans(): Promise<void> {
    try {
      const [monthlyResponse, yearlyResponse] = await Promise.all([
        this.jobService.findByTypeForAndDuration(2, 'MONTHLY'),
        this.jobService.findByTypeForAndDuration(2, 'YEARLY'),
      ]);
  
      this.plans = [...(monthlyResponse || []), ...(yearlyResponse || [])];
      this.monthlyPlans = this.plans.filter(p => p.duration === 'MONTHLY');
      this.yearlyPlans = this.plans.filter(p => p.duration === 'YEARLY');
  
      if (this.userMembership && this.userMembership.membershipId) {
        this.currentPlan = this.plans.find(p => p.id === this.userMembership.membershipId);
      }
  
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error loading plans:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể tải danh sách gói cước.',
      });
    }
  }
  

  togglePricing(): void {
    this.isMonthly = !this.isMonthly;
    if (this.isMonthly && this.monthlyPlans.length > 0) {
      this.selectedPackage = this.monthlyPlans[0].name;
    } else if (!this.isMonthly && this.yearlyPlans.length > 0) {
      this.selectedPackage = this.yearlyPlans[0].name;
    }
  }

  showConfirmDialog(plan: any): void {
    if (this.userMembership && this.userMembership.status && this.userMembership.membershipId === plan.id) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cảnh báo',
        detail: 'Bạn đang sử dụng gói này rồi, vui lòng chọn gói khác.',
      });
      return;
    }

    this.selectedPlan = plan;
    this.isRenewal = false;
    this.agreeToTerms = false;
    this.displayDialog = true;
  }

  showRenewDialog(): void {
    if (!this.userMembership || !this.currentPlan) {
      this.messageService.add({ severity: 'error', summary: 'Lỗi', detail: 'Không tìm thấy thông tin gói cước để gia hạn.' });
      return;
    }
    this.selectedPlan = this.currentPlan;
    this.isRenewal = true;
    this.agreeToTerms = false;
    this.displayDialog = true;
  }

  proceedToPayment(): void {
    if (!this.agreeToTerms) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cảnh báo',
        detail: 'Vui lòng đồng ý với điều khoản trước khi thanh toán.',
      });
      return;
    }
  
    const amount = this.selectedPlan.price;
    localStorage.setItem('selectedPlan', JSON.stringify({ 
      ...this.selectedPlan, 
      isRenewal: this.isRenewal,
      selectedRenewalMonths: this.selectedRenewalMonths
    }));
  
    const returnUrl = window.location.origin + '/employer/pricing';
  
    this.userService
      .payment(amount, returnUrl)
      .then((response) => {
        if (response && response.paymentUrl) {
          this.displayDialog = false;
          window.location.href = response.paymentUrl;
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Không thể tạo URL thanh toán.',
          });
        }
      })
      .catch((error) => {
        console.error('Error creating payment URL:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Có lỗi xảy ra khi tạo thanh toán.',
        });
      });
  }
  

  async handlePaymentResult(params: any): Promise<void> {
    const responseCode = params['vnp_ResponseCode'];
    const transactionNo = params['vnp_TransactionNo'] || 'N/A';

    if (responseCode === '00') {
      const storedPlan = localStorage.getItem('selectedPlan');
      if (!storedPlan) {
        this.messageService.add({ severity: 'error', summary: 'Lỗi', detail: 'Không tìm thấy thông tin gói đã chọn.' });
        return;
      }
      const selectedPlan = JSON.parse(storedPlan);
      this.selectedRenewalMonths = selectedPlan.selectedRenewalMonths || 1;
      // localStorage.removeItem('selectedPlan');

      if (selectedPlan.isRenewal) {
        await this.loadUserMembership();  // <-- thêm dòng này trước

        await this.renewMembershipAfterPayment(selectedPlan);
      } else {
        await this.createMembershipAndPayment();
      }
 
    } else if (responseCode === '24') {
      this.messageService.add({
        severity: 'warn',
        summary: 'Giao dịch bị hủy',
        detail: 'Bạn đã hủy giao dịch thanh toán.',
      });
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Thanh toán thất bại',
        detail: `Giao dịch không thành công. Mã lỗi: ${responseCode}`,
      });
    }
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
      replaceUrl: true,
    });

  }

  async renewMembershipAfterPayment(plan: any): Promise<void> {
    try {
      if (!this.userMembership) {
        this.messageService.add({ severity: 'error', summary: 'Lỗi', detail: 'Không tìm thấy thông tin gói cước.' });
        return;
      }

      const monthsToAdd = this.selectedRenewalMonths || 1;
      const currentEndDate = new Date(this.userMembership.endDate);
      const newEndDate = new Date(currentEndDate);
      newEndDate.setMonth(newEndDate.getMonth() + monthsToAdd);

      const updatedMembership = {
        ...this.userMembership,
        endDate: newEndDate,
        renewalDate: newEndDate,
        status: true,
        reminderSent: false
      };

      const membershipResponse = await this.userService.updateEmployerMembership(updatedMembership);
      if (membershipResponse.status) {
        const paymentData = {
          amount: plan.price * monthsToAdd,
          employerMembershipId: this.userMembership.id
        };
        const paymentResponse = await this.userService.createPayment(paymentData);

        if (paymentResponse.status) {
          this.userMembership = updatedMembership;
          this.messageService.add({
            severity: 'success',
            summary: 'Gia hạn thành công',
            detail: `Gói cước đã được gia hạn đến ${this.datePipe.transform(newEndDate, 'dd/MM/yyyy')}.`
          });
          await this.loadUserMembership();
        } else {
          this.messageService.add({ severity: 'error', summary: 'Lỗi', detail: 'Không thể tạo bản ghi thanh toán.' });
        }
      } else {
        this.messageService.add({ severity: 'error', summary: 'Lỗi', detail: 'Không thể gia hạn gói cước.' });
      }
    } catch (error) {
      console.error('Error during renewal:', error);
      this.messageService.add({ severity: 'error', summary: 'Lỗi', detail: 'Có lỗi xảy ra khi gia hạn gói cước.' });
    }
  }

  async createMembershipAndPayment(): Promise<void> {
    const storedPlan = localStorage.getItem('selectedPlan');
    if (!storedPlan) {
      this.messageService.add({ severity: 'error', summary: 'Lỗi', detail: 'Không tìm thấy thông tin gói đã chọn.' });
      return;
    }
    const selectedPlan = JSON.parse(storedPlan);
    localStorage.removeItem('selectedPlan');

    try {
      const membershipData = {
        userId: this.user.id,
        membershipId: selectedPlan.id,
      };
      const membershipResponse = await this.userService.createEmployerMembership(membershipData);
      if (membershipResponse.status) {
        const employerMembershipId = membershipResponse.object.id;
        const paymentData = {
          amount: selectedPlan.price,
          employerMembershipId: employerMembershipId,
        };
        const paymentResponse = await this.userService.createPayment(paymentData);

        if (paymentResponse.status) {
          this.messageService.add({
            severity: 'success',
            summary: 'Thanh toán thành công',
            detail: `Gói cước đã được kích hoạt.`,
          });
          this.loadUserMembership();
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Không thể tạo bản ghi thanh toán.',
          });
        }
      } else {
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không thể tạo gói cước.',
        });
      }
    } catch (error) {
      console.error('Error during membership and payment creation:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Có lỗi xảy ra trong quá trình xử lý.',
      });
    }
  }
}