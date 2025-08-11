import { ChangeDetectorRef, Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { User } from 'src/app/models/user.model';
import { UserService } from "src/app/services/user.service";
import { MessageService } from 'primeng/api';
import { JobService } from "src/app/services/job.service";
import { DatePipe } from '@angular/common';

@Component({
    templateUrl: "./seeker-plan.component.html",
    styleUrls: ['seeker-plan.component.css'],
    providers: [MessageService, DatePipe]
})
export class SeekerPlanComponent implements OnInit {
    user: User | null = null;
    plans: any[] = [];
    monthlyPlans: any[] = [];
    yearlyPlans: any[] = [];
    isMonthly: boolean = true;
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
    selectedRenewalMonths: number = 1; // mặc định 1 tháng
    
    constructor(
        private userService: UserService,
        private route: ActivatedRoute,
        private router: Router,
        private cdr: ChangeDetectorRef,
        private messageService: MessageService,
        private jobService: JobService,
        public datePipe: DatePipe // Changed to public
    ) {}

    async ngOnInit(): Promise<void> {
        const userData = localStorage.getItem('user');
        if (userData) {
            this.user = JSON.parse(userData);
            await this.loadUserMembership();
        } 
        this.loadPlans();
    
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
                if (this.userMembership && this.userMembership.membershipId) {
                    this.currentPlan = this.plans.find(plan => plan.id === this.userMembership.membershipId);
                    if (!this.currentPlan) {
                        await this.loadPlanDetails(this.userMembership.membershipId);
                    }
                }
                this.cdr.detectChanges();
            } catch (error) {
                console.error('Error loading user membership:', error);
                this.messageService.add({ severity: 'error', summary: 'Lỗi', detail: 'Không thể tải thông tin gói cước của bạn.' });
            }
        }
    }

    async loadPlanDetails(membershipId: number): Promise<void> {
        try {
            const monthlyResponse = await this.jobService.findByTypeForAndDuration(1, 'MONTHLY');
            const yearlyResponse = await this.jobService.findByTypeForAndDuration(1, 'YEARLY');
            const allPlans = [...(monthlyResponse || []), ...(yearlyResponse || [])];
            this.currentPlan = allPlans.find(plan => plan.id === membershipId);
            this.cdr.detectChanges();
        } catch (error) {
            console.error('Error loading plan details:', error);
        }
    }

    loadPlans(): void {
        Promise.all([
            this.jobService.findByTypeForAndDuration(1, 'MONTHLY'),
            this.jobService.findByTypeForAndDuration(1, 'YEARLY')
        ])
        .then(([monthlyResponse, yearlyResponse]) => {
            this.plans = [...(monthlyResponse || []), ...(yearlyResponse || [])];
            this.monthlyPlans = this.plans.filter(plan => plan.duration === 'MONTHLY');
            this.yearlyPlans = this.plans.filter(plan => plan.duration === 'YEARLY');
            if (this.userMembership && this.userMembership.membershipId) {
                this.currentPlan = this.plans.find(plan => plan.id === this.userMembership.membershipId);
            }
            this.cdr.detectChanges();
        })
        .catch(error => {
            console.error('Error loading plans:', error);
            this.messageService.add({ severity: 'error', summary: 'Lỗi', detail: 'Không thể tải danh sách gói cước.' });
        });
    }

    togglePricing(): void {
        this.isMonthly = !this.isMonthly;
    }

    showConfirmDialog(plan: any): void {
        if (!this.user) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Cảnh báo',
                detail: 'Vui lòng đăng nhập để mua gói cước!'
            });
            return;
        }
        if (this.userMembership && this.userMembership.status && this.userMembership.membershipId === plan.id) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Cảnh báo',
                detail: 'Bạn đang sử dụng gói này rồi, vui lòng chọn gói khác hoặc gia hạn.'
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
            detail: 'Vui lòng đồng ý với điều khoản trước khi thanh toán.'
          });
          return;
        }
      
        const planToSave = {
          ...this.selectedPlan,
          isRenewal: this.isRenewal,
          selectedRenewalMonths: this.selectedRenewalMonths
        };
      
        try {
          localStorage.setItem('selectedPlan', JSON.stringify(planToSave));
        } catch (e) {
          console.error("Không thể lưu localStorage", e);
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Không thể lưu thông tin gói cước vào trình duyệt.'
          });
          return;
        }
      
        const returnUrl = window.location.origin + '/seeker/plan';
      
        this.userService.payment(this.selectedPlan.price, returnUrl)
          .then(response => {
            if (response && response.paymentUrl) {
              this.displayDialog = false;
              setTimeout(() => {
                window.location.href = response.paymentUrl;
              }, 100);
            } else {
              this.messageService.add({ severity: 'error', summary: 'Lỗi', detail: 'Không thể tạo URL thanh toán.' });
            }
          })
          .catch(error => {
            console.error('Error creating payment URL:', error);
            this.messageService.add({ severity: 'error', summary: 'Lỗi', detail: 'Có lỗi xảy ra khi tạo thanh toán.' });
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


            if (selectedPlan.isRenewal) {
                await this.renewMembershipAfterPayment(selectedPlan);
            } else {
                await this.createMembershipAndPayment();
            }
        } else if (responseCode === '24') {
            this.messageService.add({ severity: 'warn', summary: 'Giao dịch bị hủy', detail: 'Bạn đã hủy giao dịch thanh toán.' });
        } else {
            this.messageService.add({ severity: 'error', summary: 'Thanh toán thất bại', detail: `Giao dịch không thành công. Mã lỗi: ${responseCode}` });
        }

        this.router.navigate([], { queryParams: {}, replaceUrl: true });
    }

    async renewMembershipAfterPayment(plan: any): Promise<void> {
        try {
            if (!this.userMembership) {
                this.messageService.add({ severity: 'error', summary: 'Lỗi', detail: 'Không tìm thấy thông tin gói cước.' });
                return;
            }
            console.log(this.selectedRenewalMonths);
            const monthsToAdd = this.selectedRenewalMonths || 1;
            console.log(monthsToAdd);
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
        console.log(storedPlan);
        if (!storedPlan) {
            this.messageService.add({ severity: 'error', summary: 'Lỗi', detail: 'Không tìm thấy thông tin gói đã chọn.' });
            return;
        }
        const selectedPlan = JSON.parse(storedPlan);
        localStorage.removeItem('selectedPlan');

        try {
            const membershipData = {
                userId: this.user.id,
                membershipId: selectedPlan.id
            };
            const membershipResponse = await this.userService.createEmployerMembership(membershipData);
            if (membershipResponse.status) {
                const employerMembershipId = membershipResponse.object.id;
                const paymentData = {
                    amount: selectedPlan.price,
                    employerMembershipId: employerMembershipId
                };
                const paymentResponse = await this.userService.createPayment(paymentData);

                if (paymentResponse.status) {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Thanh toán thành công',
                        detail: `Gói cước đã được kích hoạt.`
                    });
                    await this.loadUserMembership();
                } else {
                    this.messageService.add({ severity: 'error', summary: 'Lỗi', detail: 'Không thể tạo bản ghi thanh toán.' });
                }
            } else {
                this.messageService.add({ severity: 'error', summary: 'Lỗi', detail: 'Không thể tạo gói cước.' });
            }
        } catch (error) {
            console.error('Error during membership creation:', error);
            this.messageService.add({ severity: 'error', summary: 'Lỗi', detail: 'Có lỗi xảy ra khi tạo gói cước.' });
        }
    }

    getRenewalDate(): Date {
        if (!this.userMembership || !this.userMembership.endDate) {
            return new Date(); // fallback
        }
    
        const endDate = new Date(this.userMembership.endDate);
        const renewalDate = new Date(endDate);
        renewalDate.setMonth(renewalDate.getMonth() + 1);
        return renewalDate;
    }
    
}