import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { TestService } from 'src/app/services/test.service';
import { TestHistoryService } from 'src/app/services/testHistory.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-code',
  templateUrl: './code.component.html',
  styleUrls: ['./code.component.css']
})
export class CodeComponent implements OnInit{
  testCode: string = '';
  userID: number;
  ngOnInit(): void {
    const userEmail = localStorage.getItem('userEmail');
    console.log(userEmail);
    if(userEmail == null){
  
        this.router.navigate(['/login']);
 
    }  else {
      this.userService.findByEmail(userEmail).then((res) => {
        this.userID = res.data.id;
      });
    }
    
  }

  constructor(
    private router: Router,
    private testService: TestService,
    private messageService: MessageService,
    private testHistoryService: TestHistoryService,
    private userService: UserService
    ) {}

    onSubmitCode() {
 
      this.testService.findTestByCode(this.testCode).then(
        res => {
          console.log(res.data.code);
          this.testHistoryService.findByUserIdAndTestId(this.userID).then(
            r => {
              console.log(r);
              if(r != null && r.timeSubmit != null){
                this.messageService.add({
                  severity: 'error',
                  summary: 'Lỗi',
                  detail: 'Bạn đã làm bài test này rồi',
                });
              } else if(r == null || (r != null && r.timeSubmit == null)){
                this.messageService.add({
                  severity: 'success',
                  summary: 'Thành công',
                  detail: 'Mã code hợp lệ. Đang chuyển hướng...',
                });
                setTimeout(() => {
                  this.router.navigate(['/test', res.data.code]);
                }, 1000);
              } 
            }
          );
         
        
  
  
        },
        err => {
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Mã code không hợp lệ. Vui lòng kiểm tra lại.',
          });
          this.testCode = "";
        }
      );



}
}
