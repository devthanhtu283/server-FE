import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom, Observable } from 'rxjs';
import { BaseUrl } from './baseUrl.service';

@Injectable({
  providedIn: 'root'
})
export class ApplicationService {
  constructor(
    private httpClient: HttpClient,
    private baseUrl: BaseUrl,

  ) {}

   async findByEmployerId(employerId: number, currentPage: number, status: number): Promise<any> {
          return await lastValueFrom(this.httpClient.get(`${this.baseUrl.getUrlApplication()}list-seeker?employerId=${employerId}&page=${currentPage}&status=${status}`));
    }

    async listApplication(jobId: number, currentPage: number, status: number): Promise<any> {
      return await lastValueFrom(this.httpClient.get(`${this.baseUrl.getUrlApplication()}list-application?jobId=${jobId}&page=${currentPage}&status=${status}`));
    }

    async listSeekerApplied(seekerId: number, currentPage: number, status: number): Promise<any> {
      return await lastValueFrom(this.httpClient.get(`${this.baseUrl.getUrlApplication()}list-seeker-applied?seekerId=${seekerId}&page=${currentPage}&status=${status}`));
    }

    async save(application: any): Promise<any> {
        return await lastValueFrom(this.httpClient.post(this.baseUrl.getUrlApplication()
        + 'save', application));
    }

    async countApply(seekerId: number, jobId: number): Promise<any> {
      return await lastValueFrom(this.httpClient.get(`${this.baseUrl.getUrlApplication()}count-apply?seekerId=${seekerId}&jobId=${jobId}`));
    }

    async search(jobTitle?: string, seekerName?: string, currentPage: number = 0): Promise<any> {
      return await lastValueFrom(this.httpClient.get(`${this.baseUrl.getUrlApplication()}search?jobTitle=${jobTitle}&seekerName=${seekerName}&page=${currentPage}`));
    }

    async updateStatus(application: any): Promise<any> {
        return await lastValueFrom(this.httpClient.put(this.baseUrl.getUrlApplication()
        + 'update', application));
    }

    async findById(applicationId: number): Promise<any> {
      return await lastValueFrom(this.httpClient.get(this.baseUrl.getUrlApplication()
      + 'findById/' + applicationId));
    }

    async authUrl(): Promise<any> {
      return await lastValueFrom(this.httpClient.get(this.baseUrl.getUrlApplication()
      + 'auth-url'));
    }

    async checkAuth(): Promise<any> {
      return await lastValueFrom(this.httpClient.get(this.baseUrl.getUrlApplication()
      + 'check-auth'));
    }

    async sendAuthCode(code: string): Promise<any> {
      return await lastValueFrom(this.httpClient.post(`${this.baseUrl.getUrlApplication()}oauth-callback?code=${code}`, {}));
    }

    async saveEventData(eventData: any): Promise<any> {
      return await lastValueFrom(this.httpClient.post(this.baseUrl.getUrlApplication()
      + 'save-event', eventData));
    }

    async getEventData(): Promise<any> {
      return await lastValueFrom(this.httpClient.get(this.baseUrl.getUrlApplication()
      + 'get-saved-event'));
    }

    async createMeeting(meeting: any): Promise<any> {
      return await lastValueFrom(this.httpClient.post(this.baseUrl.getUrlApplication()
      + 'create-event', meeting));
    }

    async saveInterview(interview: any): Promise<any> {
      return await lastValueFrom(this.httpClient.post(this.baseUrl.getUrlApplication()
      + 'save-interview', interview));
    }

    async listInterviewOfEmployer(employerId: number, currentPage: number): Promise<any> {
      return await lastValueFrom(this.httpClient.get(`${this.baseUrl.getUrlApplication()}list-interviews-of-employer?employerId=${employerId}&page=${currentPage}`));
    }

    async listInterviewOfSeeker(seekerId: number, currentPage: number): Promise<any> {
      return await lastValueFrom(this.httpClient.get(`${this.baseUrl.getUrlApplication()}list-interviews-of-seeker?seekerId=${seekerId}&page=${currentPage}`));
    }

    async update(interview: any): Promise<any> {
      return await lastValueFrom(this.httpClient.put(this.baseUrl.getUrlApplication()
      + 'update-interview', interview));
    }

    async countApplicantsByJobId(jobId: number): Promise<any> {
      return await lastValueFrom(this.httpClient.get(`${this.baseUrl.getUrlApplication()}${jobId}`));
    }
}