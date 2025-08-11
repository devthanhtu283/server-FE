import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseUrlService } from './baseUrl.service';
import { BehaviorSubject, lastValueFrom } from "rxjs";
@Injectable()
export class TestHistoryService{

    constructor(
        private baseUrlService: BaseUrlService,
        private httpClient: HttpClient

    ){}
    async save(testHistory: any) : Promise<any>{
        return await lastValueFrom(this.httpClient.post(this.baseUrlService.getQuizBaseUrl()
        + 'testHistory/save', testHistory));
    }

    async checkDone(userId: any) : Promise<any>{
        return await lastValueFrom(this.httpClient.get(this.baseUrlService.getQuizBaseUrl()
        + 'testHistory/checkDone/' + userId));
    }
    async findByUserIdAndTestId(userId: any) : Promise<any>{
        return await lastValueFrom(this.httpClient.get(this.baseUrlService.getQuizBaseUrl()
        + 'testHistory/findByUserIdAndTestId/' + userId));
    }

    async update(testHistory: any) : Promise<any>{
        return await lastValueFrom(this.httpClient.put(this.baseUrlService.getQuizBaseUrl()
        + 'testHistory/update', testHistory));
    }
   
}