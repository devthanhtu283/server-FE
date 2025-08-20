import { Injectable } from "@angular/core";

@Injectable({
  providedIn: 'root',
})
export class BaseUrl {
    private urlUserService: string = "http://103.153.68.231:8080/user/";
    private urlJobService: string = "http://103.153.68.231:8080/job/";
    private urlApplicationService: string = "http://103.153.68.231:8080/application/";
    private urlRecommendationService: string = "http://103.153.68.231:8080/python/";
    private jobImageUrl: string=  "http://103.153.68.231:8080/job-static/assets/images/";
    private locationUrl: string = "https://provinces.open-api.vn/api";
    private userFileUrl: string=  "http://103.153.68.231:8080/user-static/assets/files/";
    private urlQuizService: string = "http://103.153.68.231:8080/quiz/";
    private userImageUrl: string=  "http://103.153.68.231:8080/user-static/assets/images/";
    // private urlUserService: string = "http://localhost:8080/user/";
    // private urlJobService: string = "http://localhost:8080/job/";
    // private notificationUrl: string = "http://localhost:8080/notification/";
    // private urlApplicationService: string = "http://localhost:8080/application/";
    // private urlRecommendationService: string = "http://localhost:8080/python/";
    // private jobImageUrl: string=  "http://localhost:8080/job-static/assets/images/";
    // private locationUrl: string = "https://provinces.open-api.vn/api/v1";
    // private userFileUrl: string=  "http://localhost:8080/user-static/assets/files/";
    // private urlQuizService: string = "http://localhost:8080/quiz/";
    // private userImageUrl: string=  "http://localhost:8080/user-static/assets/images/";
    getUrlUser(): string {
        return this.urlUserService;
    }
    getUrlQuiz(): string {
        return this.urlQuizService;
    }

    getUrlJob(): string {
        return this.urlJobService;
    }

    getUrlApplication(): string {
        return this.urlApplicationService;
    }

    getJobImageUrl(): string{
        return this.jobImageUrl;
    }

    getLocationUrl(): string {
        return this.locationUrl;
    }

    getUrlRecommendation(): string {
        return this.urlRecommendationService;
    }

    getUserFileUrl(): string{
        return this.userFileUrl;
    }

    getUserImageUrl(): string{
        return this.userImageUrl;
    }

} 