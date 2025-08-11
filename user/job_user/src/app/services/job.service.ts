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

    return this.http.get(this.baseUrl.getUrlJob() + 'searchBarJobs', { params });
  }
  async skillFindAll(): Promise<any> {
    return await lastValueFrom(
      this.http.get(this.baseUrl.getUrlJob() + 'skill/findAll')
    );
  }
  async favoriteFindBySeekerIdPagination(seekerId: number, page: number): Promise<any> {
    return await lastValueFrom(
      this.http.get(this.baseUrl.getUrlJob() + 'favorite/findBySeekerIdPagination/' + seekerId + '?page=' + page)
    );
  }
  async favoriteCreate(favorite: any): Promise<any> {
    return await lastValueFrom(
      this.http.post(this.baseUrl.getUrlJob() + 'favorite/create', favorite)
    );
  }
  async favoriteCheckExists(jobId: number, seekerId: number): Promise<any> {
    return lastValueFrom(this.http.get(
      this.baseUrl.getUrlJob() + 'favorite/checkExists/' + jobId + '/' + seekerId
    ));
  }
  async feedbackCreate(feedback: any): Promise<any> {
    return await lastValueFrom(
      this.http.post(this.baseUrl.getUrlJob() + 'feedback/create', feedback)
    );
  }
  async findByEmployerIdPagination(employerId: number, page: number): Promise<any> {
    return await lastValueFrom(
      this.http.get(this.baseUrl.getUrlJob() + 'findByEmployerIdPagination/' + employerId + '?page=' + page, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
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

  async deleteFavorite(jobId: number, seekerId: number): Promise<any> {
    return await lastValueFrom(
      this.http.delete(this.baseUrl.getUrlJob() + 'favorite/delete/' + jobId + '/' + seekerId)
    );
  }

  async createReview(review: any): Promise<any> {
    return await lastValueFrom(
      this.http.post(this.baseUrl.getUrlJob() + 'reviews', review)
    );
  }

  async getAllReviewsByStatus(employerId: number, status: boolean, currentPage?: number): Promise<any> {
    let url = `${this.baseUrl.getUrlJob()}reviews?employerId=${employerId}&status=${status}`;

    if (currentPage != null) {
      url += `&page=${currentPage}`;
    }

    return await lastValueFrom(this.http.get(url));
  }

  async getApprovedPercent(employerId: number): Promise<any> {
    return await lastValueFrom(this.http.get(`${this.baseUrl.getUrlJob()}reviews/approved-percent?employerId=${employerId}`));
  }


  async findByTypeForAndDuration(typeFor: number, duration: string): Promise<any> {
    return await lastValueFrom(
      this.http.get(this.baseUrl.getUrlJob() + 'membership/findByTypeForAndDuration/' + typeFor + '/' + duration)
    );
  }

  async getRecommendJobsBySeekerId(seekerId: number, currentPage: number): Promise<any> {
    return await lastValueFrom(this.http.get(`${this.baseUrl.getUrlJob()}recommend-jobs?seekerId=${seekerId}&page=${currentPage}`));
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
    if(seekerId) {
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

    return this.http.get(this.baseUrl.getUrlJob() + 'search-recommend-jobs', { params });
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

  async getFollowByEmployerAndSeeker(employerId: number, seekerId: number): Promise<any> {
    return await lastValueFrom(this.http.get(`${this.baseUrl.getUrlJob()}follow?employerId=${employerId}&seekerId=${seekerId}`));
}

async getSeekerFollowers(seekerId: number, status: boolean, currentPage: number): Promise<any> {
  return await lastValueFrom(this.http.get(`${this.baseUrl.getUrlJob()}follow/list-seeker-followers?seekerId=${seekerId}&status=${status}&page=${currentPage}`));
}

async searchByTitle(title: string, employerId: number, page: number): Promise<any> {
  const url = `${this.baseUrl.getUrlJob()}search?title=${encodeURIComponent(title)}&employerId=${employerId}&page=${page}`;
  return await lastValueFrom(this.http.get(url));
}

}
