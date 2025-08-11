import { BaseUrlService } from './services/baseUrl.service';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { TestComponent } from 'src/app/components/test/test.component';
import * as $ from 'jquery';
import { FormsModule } from '@angular/forms';
import { LoginComponent } from './components/login/login.component';
import { CodeComponent } from './components/code/code.component';
import { HttpClient, HttpClientModule } from "@angular/common/http";
import { UserService } from './services/user.service';
import { TestService } from './services/test.service';
import { QuestionService } from './services/question.service';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TestHistoryService } from './services/testHistory.service';

@NgModule({
  declarations: [
    AppComponent,
    TestComponent,
    LoginComponent,
    CodeComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    ToastModule,
    BrowserAnimationsModule
   
  ],
  providers: [
    UserService,
    BaseUrlService,
    TestService,
    QuestionService,
    MessageService,
    TestHistoryService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
