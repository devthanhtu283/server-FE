import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, Subject, Subscription } from 'rxjs';
import { ConfirmationService, MessageService } from 'primeng/api';
import { BaseUrl } from 'src/app/service/baseUrl.service';
import { JobService } from 'src/app/service/job.service';

@Component({
  selector: 'app-membership',
  templateUrl: './membership.component.html',
  styleUrls: ['./membership.component.css'],
})
export class MembershipComponent implements OnInit, OnDestroy {
  memberships: any[] = [];
  searchQuery = '';
  searchSubject = new Subject<string>();
  searchSubscription: Subscription | undefined;
  selectedTypeFor: number | null = null;

  // Dialog variables
  displayCreateDialog = false;
  displayUpdateDialog = false;
  selectedMembership: any = {};
  newMembership: any = { name: '', price: 0, description: '', duration: '', status: true, typeFor: null };
  currentUser: any;

  constructor(
    private membershipService: JobService,
    private router: Router,
    private confirmationService: ConfirmationService,
    private baseUrl: BaseUrl,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    // Get current user (admin) from localStorage
    this.currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (!this.currentUser || !this.currentUser.id) {
      this.router.navigate(['/']);
      return;
    }

    this.setupSearch();
    this.fetchMemberships();
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
        this.fetchMemberships();
      });
  }

  onSearch() {
    this.searchSubject.next(this.searchQuery);
  }

  filterTypeFor(typeFor: number | null) {
    this.selectedTypeFor = typeFor;
    this.fetchMemberships();
  }

  async fetchMemberships() {
    try {
      const response = await this.membershipService.membershipFindAll();
      let memberships = response || [];
      
      // Client-side filtering for search and typeFor
      if (this.searchQuery) {
        memberships = memberships.filter((m: any) =>
          m.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          m.description.toLowerCase().includes(this.searchQuery.toLowerCase())
        );
      }
      if (this.selectedTypeFor !== null) {
        memberships = memberships.filter((m: any) => m.typeFor === this.selectedTypeFor);
      }
      
      this.memberships = memberships;
      console.log(this.memberships);
    } catch (err) {
      console.error('❌ Fetch memberships failed:', err);
      this.messageService.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Tải danh sách gói cước thất bại.'
      });
    }
  }

  openCreateDialog() {
    this.newMembership = { name: '', price: 0, description: '', duration: '', status: true, typeFor: null };
    this.displayCreateDialog = true;
  }

  closeCreateDialog(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.displayCreateDialog = false;
    this.newMembership = { name: '', price: 0, description: '', duration: '', status: true, typeFor: null };
  }

  async createMembership() {
    if (!this.newMembership.name || !this.newMembership.price || !this.newMembership.duration || this.newMembership.typeFor === null) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cảnh báo',
        detail: 'Vui lòng nhập đầy đủ tên, giá, thời hạn và loại gói cước.'
      });
      return;
    }

    try {
      await this.membershipService.membershipCreate(this.newMembership);
      this.messageService.add({
        severity: 'success',
        summary: 'Thành công',
        detail: 'Tạo gói cước thành công.'
      });
      this.closeCreateDialog();
      await this.fetchMemberships();
    } catch (err) {
      console.error('Error creating membership:', err);
      this.messageService.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Tạo gói cước thất bại.'
      });
    }
  }

  openUpdateDialog(membership: any) {
    this.selectedMembership = { ...membership };
    this.displayUpdateDialog = true;
  }

  closeUpdateDialog(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.displayUpdateDialog = false;
    this.selectedMembership = null;
  }

  async updateMembership() {
    if (!this.selectedMembership?.name || !this.selectedMembership?.price || !this.selectedMembership?.duration || this.selectedMembership?.typeFor === null) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cảnh báo',
        detail: 'Vui lòng nhập đầy đủ tên, giá, thời hạn và loại gói cước.'
      });
      return;
    }

    try {
      await this.membershipService.membershipUpdate(this.selectedMembership.id, this.selectedMembership);
      this.messageService.add({
        severity: 'success',
        summary: 'Thành công',
        detail: 'Cập nhật gói cước thành công.'
      });
      this.closeUpdateDialog();
      await this.fetchMemberships();
    } catch (err) {
      console.error('Error updating membership:', err);
      this.messageService.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Cập nhật gói cước thất bại.'
      });
    }
  }

  deactivateMembership(id: number, name: string) {
    this.confirmationService.confirm({
      message: `Bạn có chắc muốn vô hiệu hóa gói cước <strong>${name}</strong>?`,
      header: 'Xác nhận vô hiệu hóa',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Duyệt',
      rejectLabel: 'Hủy',
      acceptButtonStyleClass: 'p-button-success',
      rejectButtonStyleClass: 'p-button-danger',
      accept: async () => {
        try {
          await this.membershipService.membershipDeactivate(id);
          this.messageService.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Vô hiệu hóa gói cước thành công.'
          });
          await this.fetchMemberships();
        } catch (err) {
          console.error('Error deactivating membership:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Vô hiệu hóa gói cước thất bại.'
          });
        }
      }
    });
  }

  stopPropagation(event: Event) {
    event.stopPropagation();
  }
}