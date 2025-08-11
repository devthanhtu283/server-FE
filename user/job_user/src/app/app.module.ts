import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SeekerHomeComponent } from './components/seeker/seeker-home/seeker-home.component';
import { UserService } from './services/user.service';
import { MessagesModule } from 'primeng/messages';
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { BaseUrl } from './services/baseUrl.service';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { DatePipe } from '@angular/common';
import { VerifyAccountComponent } from './components/seeker/verify/verify-account.component';
import { ForgotPasswordComponent } from './components/seeker/forgot-password/forgot-password.component';
import { SeekerDashboardComponent } from './components/seeker/seeker-dashboard/seeker-dashboard.component';
import { EmployerDashboardComponent } from './components/employer/employer-dashboard/employer-dashboard.component';
import { EmployerChangePasswordComponent } from './components/employer/change-password/employer-change-password.component';
import { CandidateChangePasswordComponent } from './components/seeker/seeker-change-password/candidate-change-password.component';
import { SeekerProfileComponent } from './components/seeker/seeker-profile/seeker-profile.component';
import { SeekerRoot } from './roots/seeker-root/seeker.root';
import { EmployerRoot } from './roots/employer-root/employer.root';
import { SeekerResumeComponent } from './components/seeker/seeker-resume/seeker-resume.component';
import { SeekerAlertsComponent } from './components/seeker/seeker-aleart/seeker-alerts.component';
import { SeekerAppliedJobsComponent } from './components/seeker/seeker-applied-jobs/seeker-applied-jobs.component';
import { SeekerShortListJobsComponent } from './components/seeker/seeker-shortlist-jobs/seeker-shortlist-jobs.component';
import { SeekerMessageComponent } from './components/seeker/seeker-message/seeker-message.component';
import { SeekerFollowerComponent } from './components/seeker/seeker-follower/seeker-follower.component';
import { SeekerMeetingComponent } from './components/seeker/seeker-meeting/seeker-meeting.component';
import { SeekerJobDetailsComponent } from './components/seeker/seeker-jobs-details/seeker-job-details.component';
import { SeekerContactComponent } from './components/seeker/seeker-contact/seeker-contact.component';
import { AboutComponent } from './components/about/about.component';
import { FAQComponent } from './components/faq/faq.component';
import { TermAndConditionsComponent } from './components/term&conditions/term&conditions.component';
import { PolicyComponent } from './components/policy/policy.component';
import { EmployerProfileComponent } from './components/employer/employer-profile/employer-profile.component';
import { EmployerListApplicationComponent } from './components/employer/employer-list-application/employer-list-application.component';
import { EmployerListCandidateComponent } from './components/employer/employer-list-candidate/employer-list-candidate.component';
import { EmployerJobsComponent } from './components/employer/employer-jobs/employer-jobs.component';
import { EmployerShortListCandidateComponent } from './components/employer/employer-shortlist-candidate/employer-shortlist-candidate.component';
import { EmployerMessageComponent } from './components/employer/employer-message/employer-message.component';
import { EmployerAlertsComponent } from './components/employer/employer-alerts/employer-alerts.component.';
import { EmployerMeetingComponent } from './components/employer/employer-meeting/employer-meeting.component';
import { EmployerPricingComponent } from './components/employer/employer-pricing/employer-pricing.component';
import { JobService } from './services/job.service';
import { DialogModule } from 'primeng/dialog';
import { MapComponent } from './components/seeker/test/map.component';
import { ApplicationService } from './services/application.service';
import { TimeAgoPipe } from './time-ago.pipe';
import { SeekerListJobsComponent } from './components/seeker/seeker-list-jobs/seeker-list-jobs.component';
import { SeekerFavoriteComponent } from './components/seeker/seeker-favorite/seeker-favorite.component';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';

import { LocationService } from './services/location.service';

// import { MapComponent } from './components/test/map.component';
import { EditorModule } from 'primeng/editor';

import { InputTextareaModule } from 'primeng/inputtextarea';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { CalendarModule } from 'primeng/calendar';
import { RouterModule } from '@angular/router';
import { TooltipModule } from 'primeng/tooltip';
import { WebSocketService } from './services/webSocket.service';
import { RecommendationService } from './services/recommendation.service';
import { EmployerDetailsComponent } from './components/seeker/employer-details/employer-details.componnent';

import { ReviewCompanyComponent } from './components/seeker/review-company/review-company.component';

import { SeekerPlanComponent } from './components/seeker/seeker-plan/seeker-plan.component';
import { CheckboxModule } from 'primeng/checkbox'; // Import CheckboxModule
import { SeekerSuitableJobsComponent } from './components/seeker/seeker-suitable-jobs/seeker-suitable-jobs.component';
import { EmployerTestComponent } from './components/employer/employer-test/employer-test.component';
import { QuizService } from './services/quiz.service';
import { TestHistoryService } from './services/testHistory.service';
import { SeekerCompaniesComponent } from './components/seeker/seeker-company/seeker-company.component';
import { NgxPaginationModule } from 'ngx-pagination';
import { AuthService } from './services/auth.service';
import { AuthInterceptor } from './services/auth.interceptor';
import { NotificationService } from './services/notification.service';


@NgModule({
  declarations: [
    AppComponent,
    AboutComponent,
    FAQComponent,
    TermAndConditionsComponent,
    PolicyComponent,
    ///////////////////
    SeekerRoot,
    SeekerHomeComponent,
    SeekerPlanComponent,
    SeekerDashboardComponent,
    SeekerResumeComponent,
    SeekerProfileComponent,
    SeekerAlertsComponent,
    SeekerAppliedJobsComponent,
    SeekerShortListJobsComponent,
    SeekerMessageComponent,
    SeekerFollowerComponent,
    SeekerMeetingComponent,
    SeekerJobDetailsComponent,
    SeekerContactComponent,
    SeekerListJobsComponent,
    SeekerFavoriteComponent,
    EmployerDetailsComponent,
    ReviewCompanyComponent,
    SeekerSuitableJobsComponent,
    SeekerCompaniesComponent,

    /////////////////

    /////////////////
    EmployerRoot,
    EmployerProfileComponent,
    EmployerListApplicationComponent,
    EmployerListCandidateComponent,
    EmployerJobsComponent,
    EmployerShortListCandidateComponent,
    EmployerMessageComponent,
    EmployerAlertsComponent,
    EmployerMeetingComponent,
    EmployerPricingComponent,
    EmployerTestComponent,
    ////////////////



    VerifyAccountComponent,

    EmployerDashboardComponent,
    ForgotPasswordComponent,
    EmployerChangePasswordComponent,
    CandidateChangePasswordComponent,


    // MapComponent
    MapComponent,
            TimeAgoPipe
  ],
  imports: [
    RouterModule,
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    ToastModule,
    BrowserAnimationsModule,
    AutoCompleteModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    InputTextareaModule,
    DropdownModule,
    InputNumberModule,
    CalendarModule,
    EditorModule,
    TooltipModule,
    CheckboxModule,
    NgxPaginationModule
  ],
  providers: [
    UserService,
    AuthService,
    LocationService,
    MessagesModule,
    BaseUrl,
    MessageService,
    DatePipe,
    JobService,
    ApplicationService,
    WebSocketService,
    RecommendationService,
    QuizService,
    TestHistoryService,
    NotificationService,
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
