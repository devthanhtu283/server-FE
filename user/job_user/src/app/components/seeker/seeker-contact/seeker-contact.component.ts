import { ChangeDetectorRef, Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { MessageService } from "primeng/api";
import { User } from 'src/app/models/user.model';
import { JobService } from "src/app/services/job.service";
import { UserService } from "src/app/services/user.service";

@Component({
    templateUrl: "./seeker-contact.component.html",

  })
export class SeekerContactComponent implements OnInit {
  userId: number;
  name: string = '';
  email: string = '';
  msg: string ='';
  constructor(
    private userService: UserService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private jobService: JobService,
    private messageService: MessageService
  ) {}
  user: User;
  ngOnInit(): void {
    const seekerInfo = localStorage.getItem('candidate');
    if(seekerInfo != null){
      const seeker = JSON.parse(seekerInfo);
      this.userId = seeker.data.id;
      
    }
  }
  send(){
    if(this.email == '' || this.name == '' || this.msg == ''){
      this.messageService.add({
        severity: 'error',
        summary: 'Thất bại',
        detail: 'Vui lòng nhập đủ.',
      });
    } else {
      var feedback = {
        userId : this.userId,
        content : 'User: ' + this.name + ' - Email: ' +  this.email + ' - Feedback: ' +  this.msg
      }
      this.jobService.feedbackCreate(feedback).then(
        res => {
          if(res.status){
            this.messageService.add({
              severity: 'success',
              summary: 'Thành công',
              detail: 'Đã gửi liên hệ thành công'
            });
            this.name = '';
            this.email = '';
            this.msg = '';
          } else {
            this.messageService.add({
              severity: 'error',
              summary: 'Thất bại',
              detail: 'Gửi liên hệ thất bại',
            });
          }
        }
      );
    }
 
  }

    
}