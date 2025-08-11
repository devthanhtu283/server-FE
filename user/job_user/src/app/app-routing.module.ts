import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SeekerHomeComponent } from './components/seeker/seeker-home/seeker-home.component';
import { VerifyAccountComponent } from './components/seeker/verify/verify-account.component';
import { ForgotPasswordComponent } from './components/seeker/forgot-password/forgot-password.component';
import { SeekerDashboardComponent } from './components/seeker/seeker-dashboard/seeker-dashboard.component';
import { EmployerDashboardComponent } from './components/employer/employer-dashboard/employer-dashboard.component';
import { EmployerChangePasswordComponent } from './components/employer/change-password/employer-change-password.component';
import { CandidateChangePasswordComponent } from './components/seeker/seeker-change-password/candidate-change-password.component';
import { SeekerProfileComponent } from './components/seeker/seeker-profile/seeker-profile.component';
import { SeekerRoot } from './roots/seeker-root/seeker.root';
import { EmployerRoot } from './roots/employer-root/employer.root';
import { HomeEmployerComponent } from './components/employer/home-employer/home-employer.component';
import { SeekerResumeComponent } from './components/seeker/seeker-resume/seeker-resume.component';
import { SeekerAlertsComponent } from './components/seeker/seeker-aleart/seeker-alerts.component';
import { SeekerAppliedJobsComponent } from './components/seeker/seeker-applied-jobs/seeker-applied-jobs.component';
import { SeekerShortListJobsComponent } from './components/seeker/seeker-shortlist-jobs/seeker-shortlist-jobs.component';
import { SeekerMessageComponent } from './components/seeker/seeker-message/seeker-message.component';
import { SeekerFollowerComponent } from './components/seeker/seeker-follower/seeker-follower.component';
import { SeekerMeetingComponent } from './components/seeker/seeker-meeting/seeker-meeting.component';
import { SeekerListJobsComponent } from './components/seeker/seeker-list-jobs/seeker-list-jobs.component';
import { SeekerSuitableJobsComponent } from './components/seeker/seeker-suitable-jobs/seeker-suitable-jobs.component';
import { SeekerJobDetailsComponent } from './components/seeker/seeker-jobs-details/seeker-job-details.component';
import { SeekerContactComponent } from './components/seeker/seeker-contact/seeker-contact.component';
import { AboutComponent } from './components/about/about.component';
import { FAQComponent } from './components/faq/faq.component';
import { TermAndConditionsComponent } from './components/term&conditions/term&conditions.component';
import { PolicyComponent } from './components/policy/policy.component';
import { EmployerProfileComponent } from './components/employer/employer-profile/employer-profile.component';
import { EmployerJobsComponent } from './components/employer/employer-jobs/employer-jobs.component';
import { EmployerListApplicationComponent } from './components/employer/employer-list-application/employer-list-application.component';
import { EmployerListCandidateComponent } from './components/employer/employer-list-candidate/employer-list-candidate.component';
import { EmployerShortListCandidateComponent } from './components/employer/employer-shortlist-candidate/employer-shortlist-candidate.component';
import { EmployerMessageComponent } from './components/employer/employer-message/employer-message.component';
import { EmployerAlertsComponent } from './components/employer/employer-alerts/employer-alerts.component.';
import { EmployerMeetingComponent } from './components/employer/employer-meeting/employer-meeting.component';
import { EmployerPricingComponent } from './components/employer/employer-pricing/employer-pricing.component';
import { SeekerFavoriteComponent } from './components/seeker/seeker-favorite/seeker-favorite.component';
import { EmployerDetailsComponent } from './components/seeker/employer-details/employer-details.componnent';

import { ReviewCompanyComponent } from './components/seeker/review-company/review-company.component';

import { SeekerPlanComponent } from './components/seeker/seeker-plan/seeker-plan.component';
import { EmployerTestComponent } from './components/employer/employer-test/employer-test.component';
import { SeekerCompaniesComponent } from './components/seeker/seeker-company/seeker-company.component';

// import { MapComponent } from './components/test/map.component';


const routes: Routes = [
  {
    path: '',
    redirectTo: '/seeker',
    pathMatch: 'full'
  },
  {
    path: 'seeker',
    component: SeekerRoot,
    children: [
      {
        path: "home",
        component: SeekerHomeComponent,
      },
      {
        path: "plan",
        component: SeekerPlanComponent,
      },
      {
        path: "about",
        component: AboutComponent,
      },
      {
        path: "faq",
        component: FAQComponent,
      },
      {
        path: "terms-and-conditions",
        component: TermAndConditionsComponent,
      },
      {
        path: "policy",
        component: PolicyComponent,
      },
      {
        path: "",
        component: SeekerHomeComponent,
      },
      {
        path: "company/:id",
        component: EmployerDetailsComponent,
      },
      {
        path: "it-companies",
        component: SeekerCompaniesComponent,
      },
      {
        path: "review-company/:id",
        component: ReviewCompanyComponent,
      },
      {
        path: "list-jobs",
        component: SeekerListJobsComponent,
      },
      {
        path: "suitable-jobs",
        component: SeekerSuitableJobsComponent,
      },
      {
        path: "job-details/:id",
        component: SeekerJobDetailsComponent,
      },
      {
        path: "contact",
        component: SeekerContactComponent,
      },
      {
        path: "dashboard",
        component: SeekerDashboardComponent,
      },
      {
        path: "change-password",
        component: CandidateChangePasswordComponent,
      },
      {
        path: "profile",
        component: SeekerProfileComponent,
      },
      {
        path: "resume",
        component: SeekerResumeComponent,
      },
      {
        path: "applied-job",
        component: SeekerAppliedJobsComponent,
      },
      
      {
        path: "favorite",
        component: SeekerFavoriteComponent,
      },
      {
        path: "shortlist-job",
        component: SeekerShortListJobsComponent,
      },
      {
        path: "message",
        component: SeekerMessageComponent,
      },
      {
        path: "alerts",
        component: SeekerAlertsComponent,
      },
      {
        path: "follower",
        component: SeekerFollowerComponent,
      },
      {
        path: "meeting",
        component: SeekerMeetingComponent,
      },
      {
        path: "forgot-password",
        component: ForgotPasswordComponent,
      },
      {
        path: "verify-account",
        component: VerifyAccountComponent,
      },
    ]
  },

  {
    path: "employer",
    component: EmployerRoot,
    children: [
     
      {
        path: "about",
        component: AboutComponent,
      },
      {
        path: "faq",
        component: FAQComponent,
      },
      {
        path: "terms-and-conditions",
        component: TermAndConditionsComponent,
      },
      {
        path: "policy",
        component: PolicyComponent,
      },
      {
        path: "dashboard",
        component: EmployerDashboardComponent,
      },
      {
        path: "change-password",
        component: EmployerChangePasswordComponent,
      },
      {
        path: "profile",
        component: EmployerProfileComponent,
      },
      {
        path: "jobs",
        component: EmployerJobsComponent,
      },
      {
        path: "list-application",
        component: EmployerListApplicationComponent,
      },
      {
        path: "list-seeker",
        component: EmployerListCandidateComponent,
      },
      {
        path: "shortlist-seeker",
        component: EmployerShortListCandidateComponent,
      },
      {
        path: "message",
        component: EmployerMessageComponent,
      },
      {
        path: "alerts",
        component: EmployerAlertsComponent,
      },
      {
        path: "meeting",
        component: EmployerMeetingComponent,
      },
      {
        path: "pricing",
        component: EmployerPricingComponent,
      },
      {
        path: "test",
        component: EmployerTestComponent,
      },
      {
        path: "verify-account",
        component: VerifyAccountComponent,
      },
  
    ]
  },


 
  // {
  //   path: "map",
  //   component: MapComponent,
  // },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { scrollPositionRestoration: 'enabled' }),
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
