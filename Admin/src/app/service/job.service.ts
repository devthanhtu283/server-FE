import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { lastValueFrom, Observable } from 'rxjs';
import { BaseUrl } from './baseUrl.service';

@Injectable({
  providedIn: 'root',
})
export class JobService {
  constructor(private http: HttpClient, private baseUrl: BaseUrl) {}

  async findAll(): Promise<any> {
    return await lastValueFrom(
      this.http.get(this.baseUrl.getUrlJob() + 'findAll')
    );
  }
  findAllPagination(page: number): Observable<any> {
    return this.http.get(
      this.baseUrl.getUrlJob() + 'findAllPagination?page=' + page
    );
  }
  async findById(id: number): Promise<any> {
    return await lastValueFrom(
      this.http.get(this.baseUrl.getUrlJob() + 'findById/' + id)
    );
  }
  async findByEmployerId(id: number): Promise<any> {
    return await lastValueFrom(
      this.http.get(this.baseUrl.getUrlJob() + '' + id)
    );
  }
  async findJobsByEmployerId(
    id: number,
    page: number,
    size: number
  ): Promise<any> {
    const params = {
      page: page,
      size: size,
    };

    return await lastValueFrom(
      this.http.get(this.baseUrl.getUrlJob() + id, { params })
    );
  }

  async locationFindAll(): Promise<any> {
    return await lastValueFrom(
      this.http.get(this.baseUrl.getUrlJob() + 'location/findAll')
    );
  }
  async experienceFindAll(): Promise<any> {
    return await lastValueFrom(
      this.http.get(this.baseUrl.getUrlJob() + 'experience/findAll')
    );
  }
  async worktypeFindAll(): Promise<any> {
    return await lastValueFrom(
      this.http.get(this.baseUrl.getUrlJob() + 'worktype/findAll')
    );
  }
  async categoryFindAll(): Promise<any> {
    return await lastValueFrom(
      this.http.get(this.baseUrl.getUrlJob() + 'category/findAll')
    );
  }
  async getSubcategoriesByCategoryName(categoryName: string): Promise<any> {
    return await lastValueFrom(
      this.http.get(this.baseUrl.getUrlJob() + 'category/' + categoryName)
    );
  }
  searchJobs(
    title?: string,
    locationId?: number,
    worktypeId?: number,
    experienceId?: number,
    categoryId?: number,
    page: number = 1,
    size: number = 6
  ): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (title) {
      params = params.set('title', title);
    }
    if (locationId) {
      params = params.set('locationId', locationId.toString());
    }
    if (worktypeId) {
      params = params.set('worktypeId', worktypeId.toString());
    }
    if (experienceId) {
      params = params.set('experienceId', experienceId.toString());
    }
    if (categoryId) {
      params = params.set('categoryId', categoryId.toString());
    }

    return this.http.get(this.baseUrl.getUrlJob() + 'searchJobs', { params });
  }

  searchBarJobs(
    title?: string,
    locationId?: number,
    categoryId?: number,
    page: number = 1,
    size: number = 6
  ): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (title) {
      params = params.set('title', title);
    }
    if (locationId) {
      params = params.set('locationId', locationId.toString());
    }
    if (categoryId) {
      params = params.set('categoryId', categoryId.toString());
    }

    return this.http.get(this.baseUrl.getUrlJob() + 'searchBarJobs', {
      params,
    });
  }
  async skillFindAll(): Promise<any> {
    return await lastValueFrom(
      this.http.get(this.baseUrl.getUrlJob() + 'skill/findAll')
    );
  }
  async favoriteFindBySeekerIdPagination(
    seekerId: number,
    page: number
  ): Promise<any> {
    return await lastValueFrom(
      this.http.get(
        this.baseUrl.getUrlJob() +
          'favorite/findBySeekerIdPagination/' +
          seekerId +
          '?page=' +
          page
      )
    );
  }
  async favoriteCreate(favorite: any): Promise<any> {
    return await lastValueFrom(
      this.http.post(this.baseUrl.getUrlJob() + 'favorite/create', favorite)
    );
  }
  async favoriteCheckExists(jobId: number, seekerId: number): Promise<any> {
    return lastValueFrom(
      this.http.get(
        this.baseUrl.getUrlJob() +
          'favorite/checkExists/' +
          jobId +
          '/' +
          seekerId
      )
    );
  }
  async feedbackCreate(feedback: any): Promise<any> {
    return await lastValueFrom(
      this.http.post(this.baseUrl.getUrlJob() + 'feedback/create', feedback)
    );
  }
  async findByEmployerIdPagination(
    employerId: number,
    page: number,
    size?: number
  ): Promise<any> {
    return await lastValueFrom(
      this.http.get(
        this.baseUrl.getUrlJob() +
          'findByEmployerIdPagination/' +
          employerId +
          '?page=' +
          page +
          '&size=' +
          size
      )
    );
  }
  async create(job: any): Promise<any> {
    return await lastValueFrom(
      this.http.post(this.baseUrl.getUrlJob() + 'create', job)
    );
  }
  async delete(jobId: number): Promise<any> {
    return await lastValueFrom(
      this.http.put(this.baseUrl.getUrlJob() + 'delete/' + jobId, null)
    );
  }

  async createReview(review: any): Promise<any> {
    return await lastValueFrom(
      this.http.post(this.baseUrl.getUrlJob() + 'reviews', review)
    );
  }
  async updateReviewStatus(id: number, status?: boolean): Promise<any> {
    return await lastValueFrom(
      this.http.put(this.baseUrl.getUrlJob() + 'reviews/' + id, { status })
    );
  }

  async getAllReviewsByStatus(
    employerId?: number,
    currentPage?: number,
    size?: number,
    status?: boolean
  ): Promise<any> {
    let params = new HttpParams();
  
    if (employerId != null) {
      params = params.set('employerId', employerId.toString());
    }
  
    if (typeof status === 'boolean') {
      params = params.set('status', status.toString());
    }
  
    if (currentPage != null) {
      params = params.set('page', currentPage.toString());
    }
  
    if (size != null) {
      params = params.set('size', size.toString());
    }
  
    const url = `${this.baseUrl.getUrlJob()}reviews`;
  
    return await lastValueFrom(this.http.get(url, { params }));
  }
  

  async getApprovedPercent(employerId: number): Promise<any> {
    return await lastValueFrom(
      this.http.get(
        `${this.baseUrl.getUrlJob()}reviews/approved-percent?employerId=${employerId}`
      )
    );
  }

  async findByTypeForAndDuration(
    typeFor: number,
    duration: string
  ): Promise<any> {
    return await lastValueFrom(
      this.http.get(
        this.baseUrl.getUrlJob() +
          'membership/findByTypeForAndDuration/' +
          typeFor +
          '/' +
          duration
      )
    );
  }

  async getRecommendJobsBySeekerId(
    seekerId: number,
    currentPage: number
  ): Promise<any> {
    return await lastValueFrom(
      this.http.get(
        `${this.baseUrl.getUrlJob()}recommend-jobs?seekerId=${seekerId}&page=${currentPage}`
      )
    );
  }

  searchRecommendJobs(
    seekerId: number,
    title?: string,
    locationId?: number,
    worktypeId?: number,
    experienceId?: number,
    categoryId?: number,
    page: number = 0,
    size: number = 5
  ): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    if (seekerId) {
      params = params.set('seekerId', seekerId.toString());
    }
    if (title) {
      params = params.set('title', title);
    }
    if (locationId) {
      params = params.set('locationId', locationId.toString());
    }
    if (worktypeId) {
      params = params.set('worktypeId', worktypeId.toString());
    }
    if (experienceId) {
      params = params.set('experienceId', experienceId.toString());
    }
    if (categoryId) {
      params = params.set('categoryId', categoryId.toString());
    }

    return this.http.get(this.baseUrl.getUrlJob() + 'search-recommend-jobs', {
      params,
    });
  }

  async createFollow(follow: any): Promise<any> {
    return await lastValueFrom(
      this.http.post(this.baseUrl.getUrlJob() + 'follow', follow)
    );
  }

  async updateFollow(follow: any): Promise<any> {
    return await lastValueFrom(
      this.http.put(this.baseUrl.getUrlJob() + 'follow', follow)
    );
  }

  async getFollowByEmployerAndSeeker(
    employerId: number,
    seekerId: number
  ): Promise<any> {
    return await lastValueFrom(
      this.http.get(
        `${this.baseUrl.getUrlJob()}follow?employerId=${employerId}&seekerId=${seekerId}`
      )
    );
  }

  async getSeekerFollowers(
    seekerId: number,
    status: boolean,
    currentPage: number
  ): Promise<any> {
    return await lastValueFrom(
      this.http.get(
        `${this.baseUrl.getUrlJob()}follow/list-seeker-followers?seekerId=${seekerId}&status=${status}&page=${currentPage}`
      )
    );
  }

  async searchByTitle(
    title: string,
    employerId: number,
    page: number
  ): Promise<any> {
    const url = `${this.baseUrl.getUrlJob()}search?title=${encodeURIComponent(
      title
    )}&employerId=${employerId}&page=${page}`;
    return await lastValueFrom(this.http.get(url));
  }

  async getAllJobAdmin(page: number, size: number, search?: string): Promise<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (search) {
      params = params.set('search', search);
    }

    return await lastValueFrom(
      this.http.get(this.baseUrl.getUrlJob() + 'getAllJobAdmin', { params })
    );
  }

  async membershipFindAll(): Promise<any> {
    return await lastValueFrom(
      this.http.get(`${this.baseUrl.getUrlJob()}membership/findAll`)
    );
  }

  async membershipFindById(id: number): Promise<any> {
    return await lastValueFrom(
      this.http.get(`${this.baseUrl.getUrlJob()}membership/findById/${id}`)
    );
  }


  async membershipCreate(membership: any): Promise<any> {
    return await lastValueFrom(
      this.http.post(`${this.baseUrl.getUrlJob()}membership/create`, membership)
    );
  }

  async membershipUpdate(id: number, membership: any): Promise<any> {
    return await lastValueFrom(
      this.http.put(`${this.baseUrl.getUrlJob()}membership/update/${id}`, membership)
    );
  }

  async membershipDeactivate(id: number): Promise<any> {
    return await lastValueFrom(
      this.http.put(`${this.baseUrl.getUrlJob()}membership/deactivate/${id}`, null)
    );
  }
}
