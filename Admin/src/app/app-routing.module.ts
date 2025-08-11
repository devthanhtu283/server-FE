import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './component/dashboard/dashboard.component';
import { ChatComponent } from './component/chat/chat.component';
import { PageUserProfileComponent } from './component/page-user-profile/pageuserprofile.component';
import { EmailComponent } from './component/email/email.component';
import { CalenderComponent } from './component/calender/calender.component';
import { KanbanComponent } from './component/kanban/kanban.component';
import { NoteComponent } from './component/notes/note.component';
import { ContactComponent } from './component/contact/contact.component';
import { ContactListComponent } from './component/contactlist/contactlist.component';
import { InvoiceComponent } from './component/invoice/invoice.componet';
import { ShopComponent } from './component/shop/shop.component';
import { BlogPostComponent } from './component/blogpost/blogpost.component';
import { LoginComponent } from './component/login/login.component';
import { LayoutComponent } from './layout/layout.component';
import { AuthGuard } from './service/auth-guard.service';
import { AccountComponent } from './component/account/account.component';
import { SeekerDetailsComponent } from './component/seeker-details/seeker-details.component';
import { EmployerDetailsComponent } from './component/employer-details/employer-details.component';
import { JobsComponent } from './component/job/jobs.component';
import { MeetingComponent } from './component/meeting/meeting.component';
import { MembershipComponent } from './component/membership/membership.component';
import { PaymentComponent } from './component/payment/payment.component';
import { ReviewComponent } from './component/review-company/review.component';
// import { AccountComponent } from './component/account/account.component';

const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [AuthGuard], // bảo vệ toàn bộ layout
    children: [
 
      { path: 'dashboard', component: DashboardComponent },
      { path: 'chat', component: ChatComponent },
      { path: 'pageuserprofile', component: PageUserProfileComponent },
      { path: 'email', component: EmailComponent },
      { path: 'calender', component: CalenderComponent },
      { path: 'kanban', component: KanbanComponent },
      { path: 'note', component: NoteComponent },
      { path: 'contact', component: ContactComponent },
      { path: 'contactlist', component: ContactListComponent },
      { path: 'invoice', component: InvoiceComponent },
      { path: 'shop', component: ShopComponent },
      { path: 'blogpost', component: BlogPostComponent },
      { path: 'accounts', component: AccountComponent},
      { path: 'jobs', component: JobsComponent},
      { path: 'meetings', component: MeetingComponent},
      {path: "seeker-details/:id",component: SeekerDetailsComponent},
      {path: "employer-details/:id",component: EmployerDetailsComponent},
      { path: 'membership', component: MembershipComponent},
      { path: 'payment', component: PaymentComponent},
      { path: 'review-company', component: ReviewComponent},
    ]
  },
  // Route riêng không dùng layout (login, 404...)
  { path: 'login', component: LoginComponent },

  // fallback nếu route không khớp
  { path: '**', redirectTo: 'dashboard' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
