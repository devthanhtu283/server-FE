import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseUrl } from './baseUrl.service';
import { BehaviorSubject, lastValueFrom } from "rxjs";
import { Employee, Seeker, User } from '../models/user.model';
import { EmployerDTO } from '../models/employer.model';
@Injectable({
    providedIn: 'root',
})
export class UserService {
    constructor(
        private baseUrl: BaseUrl,
        private httpClient: HttpClient

    ){}

    async login(user: any): Promise<any> {
        return await lastValueFrom(this.httpClient.post(this.baseUrl.getUrlUser()
        + 'login', user));
    }

    async register(user: any) : Promise<any>{
        return await lastValueFrom(this.httpClient.post(this.baseUrl.getUrlUser()
        + 'register', user));
    }

    async findById(id: number) : Promise<any>{
        return await lastValueFrom(this.httpClient.get(this.baseUrl.getUrlUser()
        + 'findById/' + id));
    }

    async sendEmail(email: any) : Promise<any> {
        return await lastValueFrom(this.httpClient.post(this.baseUrl.getNotificationUrl()
        + 'sendEmail', email));
    }

    async verifyAccount(email: string, securityCode: string) : Promise<any> {
         // Đảm bảo email được mã hóa đúng
         const encodedEmail = encodeURIComponent(email);

        return await lastValueFrom(this.httpClient.get<any>(`${this.baseUrl.getUrlUser()}verifyAccount?email=${encodedEmail}&securityCode=${securityCode}`));
    }

    async findByEmail(email: string) : Promise<User> {
        const encodedEmail = encodeURIComponent(email);

        return await lastValueFrom(this.httpClient.get<any>(`${this.baseUrl.getUrlUser()}findByEmail/${encodedEmail}`));
    }

    async update(user: User) : Promise<any>{
        return await lastValueFrom(this .httpClient.put(this.baseUrl.getUrlUser()
        + 'update' , user));
    }
    async test(form: FormData) : Promise<any>{
        return await lastValueFrom(this .httpClient.post(this.baseUrl.getUrlUser()
        + 'upload', form));
    }

    async updateCandidate(formData: FormData): Promise<any> {
        return await lastValueFrom(this.httpClient.post(this.baseUrl.getUrlUser()
        + 'seeker/update', formData));
    }

    async findByIdSeeker(id: number): Promise<any> {
        return await lastValueFrom(this.httpClient.get(this.baseUrl.getUrlUser()
        + 'seeker/findById/' + id));
    }

    async updateEmployer(employer: Employee): Promise<any> {
        return await lastValueFrom(this.httpClient.post(this.baseUrl.getUrlUser()
        + 'employer/save', employer));
    }

    async findByIdEmployer(id: number): Promise<any> {
        return await lastValueFrom(this.httpClient.get(this.baseUrl.getUrlUser()
        + 'employer/findById/' + id));
    }

    async uploadFile(file: File): Promise<any> {
        const formData = new FormData();
        formData.append('file', file);
        return await lastValueFrom(this.httpClient.post(this.baseUrl.getUrlUser()
        + 'seeker/upload', formData, { responseType: 'text' }));
    }

    uploadCV(formData: FormData): Promise<any> {
        return lastValueFrom(
          this.httpClient.post(this.baseUrl.getUrlUser() + 'uploadCV', formData)
        );
      }

      applyCV(formData: FormData): Promise<any> {
        return lastValueFrom(
          this.httpClient.post(this.baseUrl.getUrlUser() + 'seeker/applyCV', formData)
        );
      }


    async getReceiverIdsByUserId(id: number): Promise<any> {
        return await lastValueFrom(this.httpClient.get(this.baseUrl.getUrlUser()
        + 'chat/getReceiverIdsByUserId/' + id));
    }
    async getMessagesBetweenUsers(senderId: number, receiverId: number): Promise<any> {
        return await lastValueFrom(this.httpClient.get(this.baseUrl.getUrlUser()
        + 'chat/getMessagesBetweenUsers/' + senderId + '/' + receiverId));
    }

    async sendMessage(chat: any) : Promise<any>{
        return await lastValueFrom(this.httpClient.post(this.baseUrl.getUrlUser()
        + 'chat/save-message', chat));
    }



    async saveCV(cv: any): Promise<any> {

        return await lastValueFrom(this.httpClient.post(this.baseUrl.getUrlUser()
        + 'cv/save', cv));
    }

    async findCVBySeekerId(id: number): Promise<any> {
        return await lastValueFrom(this.httpClient.get(this.baseUrl.getUrlUser()
        + 'cv/findBySeekerId/' + id));
    }

    async payment(amount: number, returnUrl: string): Promise<any> {
        const encodedUrl = encodeURIComponent(returnUrl);
        return await lastValueFrom(
          this.httpClient.get(
            `${this.baseUrl.getUrlUser()}payment/${amount}?returnUrl=${encodedUrl}`
          )
        );
      }
      

    async findEmployerMembershipByUserId(userId: number): Promise<any> {
        return await lastValueFrom(this.httpClient.get(this.baseUrl.getUrlUser()
        + 'employerMembership/findByUserId/' + userId));
    }

    async createEmployerMembership(data: any): Promise<any> {

        return await lastValueFrom(this.httpClient.post(this.baseUrl.getUrlUser()
        + 'employerMembership/create', data));
    }

    async updateEmployerMembership(data: any): Promise<any> {

        return await lastValueFrom(this.httpClient.put(this.baseUrl.getUrlUser()
        + 'employerMembership/update', data));
    }
    async createPayment(data: any): Promise<any> {

        return await lastValueFrom(this.httpClient.post(this.baseUrl.getUrlUser()
        + 'payment/create', data));
    }

    async sendEmailTest(email: any) : Promise<any> {
        return await lastValueFrom(this.httpClient.post(this.baseUrl.getUrlUser()
        + 'sendEmailTest', email));
    }

    async getLargeCompanies(currentPage: number): Promise<any> {
        return await lastValueFrom(this.httpClient.get(`${this.baseUrl.getUrlUser()}employer/get-large-companies?page=${currentPage}`));
    }

    async getMediumAndSmallCompanies(currentPage: number): Promise<any> {
        return await lastValueFrom(this.httpClient.get(`${this.baseUrl.getUrlUser()}employer/get-medium-companies?page=${currentPage}`));
    }
    async search(keyword: string): Promise<any> {
        return await lastValueFrom(this.httpClient.get(`${this.baseUrl.getUrlUser()}employer/search?keyword=${keyword}`));
    }

    updateEmployerProfile(employerDTO: EmployerDTO, logo: File | null, coverImg: File | null): Promise<any> {
        const formData = new FormData();
        try {
          formData.append('employerDTO', new Blob([JSON.stringify(employerDTO)], { type: 'application/json' }));
        } catch (err) {
          console.error('Error serializing employerDTO:', err);
          throw new Error('Invalid employerDTO JSON: ' + err.message);
        }
        if (logo) {
          formData.append('logo', logo, logo.name);
        }
        if (coverImg) {
          formData.append('coverImg', coverImg, coverImg.name);
        }
        const url = `${this.baseUrl.getUrlUser()}employer/update`;
        console.log(`Calling POST ${url}`);
        return this.httpClient.post(url, formData)
          .toPromise()
          .then((response: any) => {
            console.log('updateEmployerProfile response:', response);
            return response;
          })
          .catch((err) => {
            console.error('Error in updateEmployerProfile:', err);
            throw new Error('Failed to update employer: ' + (err.message || err.statusText));
          });
      }

      googleLogin(data: { idToken: string; userType: number }) {
        return this.httpClient.post<any>('http://103.153.68.231:8080/user/google-login', data);
      }
      
}