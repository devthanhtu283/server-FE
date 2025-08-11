import { NgModule,CUSTOM_ELEMENTS_SCHEMA  } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
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
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { AuthInterceptor } from './service/auth.interceptor';
import { UserService } from './service/user.service';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AccountComponent } from './component/account/account.component';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DatePipe } from '@angular/common';
import { SeekerDetailsComponent } from './component/seeker-details/seeker-details.component';
import { ApplicationService } from './service/application.service';
import { JobService } from './service/job.service';
import { EmployerDetailsComponent } from './component/employer-details/employer-details.component';
import { JobsComponent } from './component/job/jobs.component';
import { MeetingComponent } from './component/meeting/meeting.component';
import { WebSocketService } from './service/webSocket.service';
import { MembershipComponent } from './component/membership/membership.component';
import { PaymentComponent } from './component/payment/payment.component';
import { ReviewComponent } from './component/review-company/review.component';

@NgModule({
  declarations: [
    LayoutComponent,
    AppComponent,
    DashboardComponent,
    ChatComponent,
    PageUserProfileComponent,
    EmailComponent,
    CalenderComponent,
    KanbanComponent,
    NoteComponent,
    ContactComponent,
    ContactListComponent,
    InvoiceComponent,
    ShopComponent,
    BlogPostComponent,
    LoginComponent,
    AccountComponent,
    SeekerDetailsComponent,
    EmployerDetailsComponent,
    JobsComponent,
    MeetingComponent,
    MembershipComponent,
    PaymentComponent,
    ReviewComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    RouterModule,
    FormsModule,
    HttpClientModule,
    ReactiveFormsModule,
    TooltipModule,
    ConfirmDialogModule,
    ToastModule,
    BrowserAnimationsModule
  ],
  providers: [
    UserService,
    MessageService,
    ConfirmationService,
    ApplicationService,
    JobService,
    DatePipe,
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    WebSocketService
  ],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule { }
