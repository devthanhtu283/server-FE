import { ChangeDetectorRef, Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { Job } from "src/app/models/job.model";
import { User } from 'src/app/models/user.model';
import { BaseUrl } from "src/app/services/baseUrl.service";
import { JobService } from "src/app/services/job.service";
import { UserService } from "src/app/services/user.service";

@Component({
  templateUrl: "./seeker-favorite.component.html"
})
export class SeekerFavoriteComponent implements OnInit {
  seekerId: number;
  currentPage: number = 1;
  totalPages: number = 1;
  listJobIds: number[] = [];
  jobs: Job[] = [];
  imgBaseUrl: string;
  filteredJobs: Job[] = [];
  searchTerm: string = '';

  constructor(
    private userService: UserService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private jobService: JobService,
    private baseUrl: BaseUrl
  ) {}

  ngOnInit(): void {
    this.imgBaseUrl = this.baseUrl.getUserImageUrl();
    const seekerInfo = localStorage.getItem('candidate');
    if (seekerInfo) {
      const seeker = JSON.parse(seekerInfo);
      this.seekerId = seeker.data.id;
      this.loadFavorites(this.currentPage);
    } else {
      console.error('No seeker info found in localStorage');
    }
  }

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.jobs = [];
    this.loadFavorites(this.currentPage);
  }

  loadFavorites(page: number): void {
    this.currentPage = page;
    this.jobs = [];

    this.jobService.favoriteFindBySeekerIdPagination(this.seekerId, this.currentPage).then(res => {
      this.totalPages = res.totalPages;
      const favorites = res.content;

      const jobPromises = favorites.map(fav =>
        this.jobService.findById(fav.jobId)
      );

      Promise.all(jobPromises).then(result => {
        this.jobs = result;
        this.filterJobs(); // Apply search filter after loading
        this.cdr.detectChanges();
      });
    }).catch(error => {
      console.error('Error loading favorites:', error);
    });
  }

  filterJobs(): void {
    if (!this.searchTerm.trim()) {
      this.filteredJobs = [...this.jobs];
    } else {
      const searchLower = this.searchTerm.trim().toLowerCase();
      this.filteredJobs = this.jobs.filter(job =>
        job.title?.toLowerCase().includes(searchLower)
      );
    }
    this.cdr.detectChanges();
  }

  getPages(): number[] {
    const pages = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  removeFavorite(jobId: number, seekerId: number): void {
    this.jobService.deleteFavorite(jobId, seekerId).then(
      (res) => {
        if (res.data) {
          this.jobs = this.jobs.filter(job => job.id !== jobId);
          this.listJobIds = this.listJobIds.filter(id => id !== jobId);
          this.filterJobs(); // Reapply filter after removal
          this.cdr.detectChanges();
        }
      }
    ).catch(error => {
      console.error('Error removing favorite:', error);
    });
  }
}