import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseUrlService } from './baseUrl.service';
import { BehaviorSubject, lastValueFrom } from "rxjs";
@Injectable()
export class QuestionService{

    constructor(
        private baseUrlService: BaseUrlService,
        private httpClient: HttpClient

    ){}

    async findByTestID(testID: number) : Promise<any>{
        return await lastValueFrom(this.httpClient.get(this.baseUrlService.getQuizBaseUrl()
        + 'question/findByTestID/' + testID));
    }
}