import { Component, OnInit } from '@angular/core';
import { Interview } from 'src/app/models/interview.model';
import { ApplicationService } from 'src/app/service/application.service';

@Component({
  templateUrl: './meeting.component.html',
})
export class MeetingComponent implements OnInit {
  interviews: Interview[];
  pageSize = 10;
  currentPage = 1;
  totalPages = 1;
  totalItems = 0;
  pageInfo = '';

  constructor(private applicationService: ApplicationService) {}

  ngOnInit() {
    this.fetchInterviews();
  }

  onPageSizeChange() {
    this.currentPage = 1;
    this.fetchInterviews();
  }

  onPageChange(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.fetchInterviews();
    }
  }

  fetchInterviews() {
    this.applicationService
      .listInterviews(this.currentPage - 1, this.pageSize)
      .then((res) => {
        this.interviews = res['data']['content'].sort((a, b) => b.id - a.id);
        this.totalItems = res['data']['totalElements'];
        this.totalPages = res['data']['totalPages'];
      });
  }

  updatePageInfo() {
    const start = (this.currentPage - 1) * this.pageSize + 1;
    const end = Math.min(this.currentPage * this.pageSize, this.totalItems);
    this.pageInfo = `${start}–${end} của ${this.totalItems}`;
  }

  getInterviewStatus(interview: Interview): { label: string; class: string } {
    const now = new Date();
    const expired = new Date(interview.scheduledAt);

    if (expired < now) {
      return { label: 'Đã quá thời hạn', class: 'text-bg-danger' };
    }
    return { label: 'Chưa diễn ra', class: 'text-bg-success' };
  }
}
