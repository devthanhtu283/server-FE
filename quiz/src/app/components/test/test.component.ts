import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Test } from 'src/app/models/test.model';
import { QuestionService } from 'src/app/services/question.service';
import { TestService } from 'src/app/services/test.service';
import { TestHistoryService } from 'src/app/services/testHistory.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  templateUrl: './test.component.html',
  styleUrls: ['./test.component.css'],
})
export class TestComponent implements OnInit, OnDestroy {
  now: number = 0;
  totalSteps: number;
  selectedOptions: any = {};
  textAnswers: any = {};
  errorMsg: string = '';
  showResultPage: boolean = false;
  userScore: number = 0;
  maxScore: number = 0;
  passingScore: number = 80;
  code: string;
  test: Test;
  title: string;
  companyName: string;
  steps = [];
  startTest: boolean = false;
  timeLeft: number = 30 * 60; // 30 minutes in seconds
  timerInterval: any;
  userID: number;
  testID: number;

  constructor(
    private route: ActivatedRoute,
    private testService: TestService,
    private questionService: QuestionService,
    private testHistoryService: TestHistoryService,
    private userService: UserService,
    private router: Router,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    const userEmail = localStorage.getItem('userEmail');
    if (!userEmail) {
      this.messageService.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Thông tin đăng nhập không hợp lệ. Vui lòng thử lại.',
      });
      this.router.navigate(['/login']);
    } else {
      this.userService.findByEmail(userEmail).then((res) => {
        this.userID = res.data.id;
      });
    }

    this.route.paramMap.subscribe((params) => {
      this.code = params.get('code');
    });

    this.testService.findTestByCode(this.code).then((res) => {
      this.title = res.data.title;
      this.companyName = res.data.username;
      this.testID = res.data.id;
      this.questionService.findByTestID(res.data.id).then((result) => {
        this.steps = result;
        this.totalSteps = this.steps.length;
        this.maxScore =
          this.steps.filter((step) => step.questionType === 'choiceAnswer')
            .length * 20;
      });
    });
  }

  ngOnDestroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  startTimer() {
    this.timerInterval = setInterval(() => {
      if (this.timeLeft > 0) {
        this.timeLeft--;
      } else {
        clearInterval(this.timerInterval);
        this.calculateScore();
      }
    }, 1000);
  }

  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  }

  getCurrentStep() {
    return this.steps[this.now];
  }

  validate(stepId: number): boolean {
    const currentStep = this.steps[stepId - 1];
    if (
      currentStep.questionType === 'choiceAnswer' &&
      !this.selectedOptions[stepId]
    ) {
      this.errorMsg = 'Hãy chọn đáp án';
      return false;
    } else if (
      currentStep.questionType === 'textAnswer' &&
      !this.textAnswers[stepId]
    ) {
      this.errorMsg = 'Hãy điền câu trả lời!';
      return false;
    }
    this.errorMsg = '';
    return true;
  }

  nextStep() {
    if (this.validate(this.now + 1)) {
      this.now = this.now + 1;
    }
    if (this.now === this.totalSteps) {
      this.calculateScore();
    }
  }

  prevStep() {
    if (this.now > 0) {
      this.now = this.now - 1;
    }
  }

  calculateScore() {
    this.userScore = 0;
    let i = 0;
    this.steps.forEach((step) => {
      i++;
      if (step.questionType === 'choiceAnswer') {
        const selectedAnswer = this.selectedOptions[i];
        const correctAnswer = step.answers.find((answer) => answer.correct);
        if (selectedAnswer === correctAnswer?.content) {
          this.userScore += 10;
        }
      }
    });
    this.showResultPage = true;
    clearInterval(this.timerInterval);
    const contentAnswerText = Object.entries(this.textAnswers)
      .map(([stepId, answer]) => `Câu ${stepId}: ${answer}`)
      .join(' | ');

    // Tìm và cập nhật testHistory
    this.testHistoryService.findByUserIdAndTestId(this.userID).then((res) => {
      console.log(res);
      if (res) {
        // Cập nhật bản ghi testHistory hiện có
        const updatedTestHistory = {
          id: res.id, // ID của bản ghi testHistory
          userID: this.userID,
          testID: this.testID,
          score: this.userScore,
          contentAnswer: contentAnswerText,
        };
        console.log(updatedTestHistory);
        this.testHistoryService.update(updatedTestHistory).then((updateRes) => {
          console.log('Cập nhật testHistory thành công:', updateRes);
        }).catch((err) => {
          console.error('Lỗi khi cập nhật testHistory:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Không thể cập nhật kết quả bài test. Vui lòng thử lại.',
          });
        });
      } else {
        // Dự phòng: Tạo mới nếu không tìm thấy testHistory (không nên xảy ra)
        const newTestHistory = {
          userID: this.userID,
          testID: this.testID,
          score: this.userScore,
          contentAnswer: contentAnswerText,
          timeSubmit: new Date(),
        };
        this.testHistoryService.save(newTestHistory).then((saveRes) => {
          console.log('Tạo mới testHistory:', saveRes);
        }).catch((err) => {
          console.error('Lỗi khi tạo mới testHistory:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Không thể lưu kết quả bài test. Vui lòng thử lại.',
          });
        });
      }
    }).catch((err) => {
      console.error('Lỗi khi tìm testHistory:', err);
      this.messageService.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể kiểm tra lịch sử bài test. Vui lòng thử lại.',
      });
    });
  }

  onOptionSelected(stepId: number, option: string) {
    this.selectedOptions[stepId] = option;
  }

  onTextAnswerChange(stepId: number, answer: string) {
    this.textAnswers[stepId] = answer;
  }

  isPassed() {
    return (this.userScore / this.maxScore) * 100 >= this.passingScore;
  }

  goToJobWeb() {
    localStorage.removeItem('userEmail');
    window.location.href = 'http://103.153.68.231:4200/';
  }
}