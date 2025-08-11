import { Injectable } from "@angular/core";

@Injectable()
export class BaseUrlService{
    private BaseUrl: string = "http://103.153.68.231:8080/quiz/";
    private UserBaseUrl: string = "http://103.153.68.231:8080/user/";
    private QuizBaseUrl: string = "http://103.153.68.231:8080/quiz/";
    getBaseUrl(): string {
        return this.BaseUrl;
    }
    getUserBaseUrl(): string {
        return this.UserBaseUrl;
    }
    getQuizBaseUrl(): string {
        return this.QuizBaseUrl;
    }

}