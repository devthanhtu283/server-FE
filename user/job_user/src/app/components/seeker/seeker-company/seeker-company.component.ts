import { ChangeDetectorRef, Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import pLimit from "p-limit";
import { Employee, User } from 'src/app/models/user.model';
import { JobService } from "src/app/services/job.service";
import { UserService } from "src/app/services/user.service";
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { BaseUrl } from "src/app/services/baseUrl.service";

@Component({
  templateUrl: "./seeker-company.component.html",
  styleUrls: ["./seeker-company.component.css"],
})
export class SeekerCompaniesComponent implements OnInit {
  companies: Employee[] = [];
  selectedCategory: string = 'large';
  currentPage: number = 1;
  totalPages: number = 1;
  totalCompanies: number = 0;
  pageSize: number = 10;
  totalElements: number = 0;
  openJob: { [key: number]: number } = {};
  searchKeyword: string = '';
  filteredSuggestions: Employee[] = [];
  showSuggestions: boolean = false;

  private searchInput$ = new Subject<string>();
  imgUrl: string;

  constructor(
    private userService: UserService,
    private jobService: JobService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private baseUrl: BaseUrl
  ) {}

  user: User;

  ngOnInit(): void {
    this.imgUrl = this.baseUrl.getUserImageUrl();
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
      this.router.navigate(['/']);
    } else {
      this.user = user;
      this.loadCompanies(this.currentPage);
    }
    this.searchInput$.pipe(debounceTime(300)).subscribe(keyword => {
        this.performSearch(keyword);
    });
  }

  onCategoryChange(): void {
    this.currentPage = 1;
    this.loadCompanies(this.currentPage);
  }

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.loadCompanies(page);
  }

  getPages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  getCompanyRange(): string {
    const start = (this.currentPage - 1) * this.pageSize + 1;
    const end = Math.min(this.currentPage * this.pageSize, this.totalCompanies);
    return `Hiển thị ${start}-${end} trong tổng số ${this.totalCompanies} kết quả`;
  }

  getOpenJobCount(employerId: number): void {
    this.jobService.findByEmployerId(employerId).then(
      (res) => {
        this.openJob[employerId] = res["data"].length;
      }
    );
  }

  async loadCompanies(page: number): Promise<void> {
    this.currentPage = page;
    const backendPage = page - 1;

    const serviceMap = {
      large: this.userService.getLargeCompanies.bind(this.userService),
      'medium-small': this.userService.getMediumAndSmallCompanies.bind(this.userService)
    };

    const fetchCompanies = serviceMap[this.selectedCategory];
    if (!fetchCompanies) return;

    const res = await fetchCompanies(backendPage);
    const data = res?.data;

    this.companies = (data?.content || []).filter(c => c.status === true);
    this.totalPages = data?.totalPages || 0;
    this.pageSize = data?.size || 10;
    this.totalCompanies = data?.totalElements || 0;

    const limit = pLimit(3); // tối đa 3 request cùng lúc
    await Promise.all(
    this.companies.map(c =>
        limit(() =>
        this.jobService.findByEmployerId(c.id).then(res => {
            this.openJob[c.id] = res.data.length;
        })
        )
    )
    );
    this.cdr.detectChanges();
  }

  onSearchInput(): void {
    const keyword = this.searchKeyword.trim().toLowerCase();
    if (keyword.length < 1) {
      this.filteredSuggestions = [];
      return;
    }
  
    this.searchInput$.next(keyword);
  }
  
  performSearch(keyword: string): void {
    if (!keyword || keyword.length < 1) {
      this.filteredSuggestions = [];
      return;
    }
  
    this.userService.search(keyword.toLowerCase())
      .then(res => {
        this.filteredSuggestions = (res.data || []).filter(c => c.status === true);
      })
      .catch(err => {
        this.filteredSuggestions = [];
      });
  }
  
  
  selectCompanySuggestion(company: Employee): void {
    this.searchKeyword = company.companyName;
    this.filteredSuggestions = [];
    this.showSuggestions = false;
    this.companies = [company]; 
  }
  
  hideSuggestions(): void {
    setTimeout(() => this.showSuggestions = false, 200);
  }

  
}
