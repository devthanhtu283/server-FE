import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { BehaviorSubject, lastValueFrom } from "rxjs";
import { BaseUrl } from './baseUrl.service';
@Injectable()
export class TestHistoryService{

    constructor(
        private baseUrlService: BaseUrl,
        private httpClient: HttpClient

    ){}
    async save(testHistory: any) : Promise<any>{
        return await lastValueFrom(this.httpClient.post(this.baseUrlService.getUrlQuiz()
        + 'testHistory/save', testHistory));
    }

    async checkDone(userId: any) : Promise<any>{
        return await lastValueFrom(this.httpClient.get(this.baseUrlService.getUrlQuiz()
        + 'testHistory/checkDone/' + userId));
    }
    async findByUserIdAndTestId(userId: any) : Promise<any>{
        return await lastValueFrom(this.httpClient.get(this.baseUrlService.getUrlQuiz()
        + 'testHistory/findByUserIdAndTestId/' + userId));
    }

    async update(testHistory: any) : Promise<any>{
        return await lastValueFrom(this.httpClient.put(this.baseUrlService.getUrlQuiz()
        + 'testHistory/update', testHistory));
    }
}