import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { lastValueFrom, Observable } from 'rxjs';
import { BaseUrl } from './baseUrl.service';

@Injectable({
  providedIn: 'root',
})
export class RecommendationService {
  constructor(private http: HttpClient, private baseUrl: BaseUrl) {}



  async extractCV(form: FormData) : Promise<any>{
    return await lastValueFrom(this.http.post(this.baseUrl.getUrlRecommendation()
    + 'cv/extract/all-features', form));
  }

  async extractJob(jobId: number): Promise<any> {
    const url = `${this.baseUrl.getUrlRecommendation()}job/extract/refresh-skills/${jobId}`;
    return await lastValueFrom(this.http.post(url, {})); // POST nhưng không cần body
  }


  async recommendationJobs(cvId: number): Promise<any> {
    return await lastValueFrom(
        this.http.post(
            this.baseUrl.getUrlRecommendation() + `match/cv/${cvId}/match-all-jobs`,
            {}
        )
    );
}
}
