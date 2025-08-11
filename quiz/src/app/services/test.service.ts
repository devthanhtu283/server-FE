import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseUrlService } from './baseUrl.service';
import { BehaviorSubject, lastValueFrom } from "rxjs";
@Injectable()
export class TestService{

    constructor(
        private baseUrlService: BaseUrlService,
        private httpClient: HttpClient

    ){}

    async findTestByCode(code: string) : Promise<any>{
        return await lastValueFrom(this.httpClient.get(this.baseUrlService.getQuizBaseUrl()
        + 'test/findTestByCode/' + code));
    }
}