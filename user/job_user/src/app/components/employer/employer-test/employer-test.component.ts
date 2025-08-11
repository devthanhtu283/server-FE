import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { User } from 'src/app/models/user.model';
import { UserService } from 'src/app/services/user.service';
import { JobService } from 'src/app/services/job.service';
import { QuizService } from 'src/app/services/quiz.service';
import * as XLSX from 'xlsx';

interface Answer {
  id?: number;
  questionId?: number;
  content: string;
  isCorrect: boolean;
}

interface Question {
  id?: number;
  testId?: number;
  questionType: number;
  content: string;
  answers: Answer[];
}

interface Test {
  id?: number;
  userId?: number;
  title: string;
  description: string;
  code: string;
  time: number;
  questions: Question[];
}

@Component({
  templateUrl: './employer-test.component.html',
  styleUrls: ['./employer-test.component.css'],
})
export class EmployerTestComponent implements OnInit {
  user: User | null = null;
  tests: Test[] = [];
  displayCreateDialog: boolean = false;
  displayEditTestDialog: boolean = false;
  displayTestDetails: boolean = false;
  displayQuestionDialog: boolean = false;
  displayEditQuestionDialog: boolean = false;
  displayImportDialog: boolean = false;

  newTest: Test = { title: '', description: '', code: '', time: 0, questions: [] };
  editTest: Test = { title: '', description: '', code: '', time: 0, questions: [] };
  selectedTest: Test | null = null;
  newQuestion: Question = { questionType: 1, content: '', answers: [{ content: '', isCorrect: false }] };
  editQuestion: Question = { questionType: 1, content: '', answers: [{ content: '', isCorrect: false }] };

  constructor(
    private userService: UserService,
    private jobService: JobService,
    private quizService: QuizService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const userData = localStorage.getItem('user');
    if (userData) {
      this.user = JSON.parse(userData);
      this.userService.findEmployerMembershipByUserId(this.user.id).then(
        (res) => {
          
          console.log(res);
          if (res && res.membershipId >= 3 && res.membershipId <= 6) {
            
          } else {
            alert('Vui lòng mua gói cước để sử dụng tính năng pro.');
            this.router.navigate(['/employer/pricing']);
          }
          
        }
      )
      this.loadTests();
    } else {
      alert('Vui lòng đăng nhập.');
      this.router.navigate(['/']);
    }
  }

  async loadTests() {
    if (this.user?.id) {
      try {
        this.tests = await this.quizService.getTestsByUserId(this.user.id);
        this.tests = this.tests.map(test => ({
          ...test,
          questions: test.questions || []
        }));
      } catch (error) {
        console.error('Error loading tests:', error);
        alert('Lỗi khi tải danh sách bài test');
      }
    }
  }

  showCreateTestDialog() {
    this.newTest = { title: '', description: '', code: '', time: 0, questions: [] };
    this.displayCreateDialog = true;
  }

  hideCreateTestDialog() {
    this.displayCreateDialog = false;
  }

  async createTest() {
    if (this.user?.id) {
      try {
        const testToSave = { ...this.newTest, userId: this.user.id };
        console.log('Creating test:', testToSave);
        const savedTest = await this.quizService.testCreate(testToSave);
        this.tests.push({ ...savedTest, questions: [] });
        this.displayCreateDialog = false;
        alert('Đã tạo bài test mới');
      } catch (error) {
        console.error('Error creating test:', error);
        alert('Lỗi khi tạo bài test');
      }
    }
  }

  showEditTestDialog(test: Test) {
    this.editTest = { ...test };
    this.displayEditTestDialog = true;
  }

  hideEditTestDialog() {
    this.displayEditTestDialog = false;
  }

  async updateTest() {
    if (this.editTest.id) {
      try {
        const updatedTest = await this.quizService.updateTest(this.editTest);
        const index = this.tests.findIndex(t => t.id === updatedTest.id);
        if (index !== -1) {
          this.tests[index] = { ...updatedTest, questions: this.tests[index].questions };
        }
        if (this.selectedTest?.id === updatedTest.id) {
          this.selectedTest = { ...updatedTest, questions: this.selectedTest.questions };
        }
        this.displayEditTestDialog = false;
        alert('Đã cập nhật bài test');
      } catch (error) {
        console.error('Error updating test:', error);
        alert('Lỗi khi cập nhật bài test');
      }
    }
  }

  async deleteTest(testId: number) {
    if (confirm('Bạn có chắc muốn xóa bài test này?')) {
      try {
        await this.quizService.deleteTest(testId);
        this.tests = this.tests.filter(t => t.id !== testId);
        if (this.selectedTest?.id === testId) {
          this.displayTestDetails = false;
          this.selectedTest = null;
        }
        alert('Đã xóa bài test');
      } catch (error) {
        console.error('Error deleting test:', error);
        alert('Lỗi khi xóa bài test');
      }
    }
  }

  async viewTest(test: Test) {
    try {
      const fullTest = await this.quizService.getTestById(test.id!);
      this.selectedTest = {
        ...fullTest,
        questions: (fullTest.questions || []).map((question: Question) => ({
          ...question,
          answers: question.answers || []
        }))
      };
      this.displayTestDetails = true;
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error loading test details:', error);
      alert('Lỗi khi tải chi tiết bài test');
    }
  }

  hideTestDetailsDialog() {
    this.displayTestDetails = false;
    this.displayQuestionDialog = false;
    this.displayEditQuestionDialog = false;
    this.displayImportDialog = false;
  }

  showAddQuestionDialog() {
    this.newQuestion = { questionType: 1, content: '', answers: [{ content: '', isCorrect: false }] };
    this.displayQuestionDialog = true;
  }

  hideAddQuestionDialog() {
    this.displayQuestionDialog = false;
  }

  showEditQuestionDialog(question: Question) {
    this.editQuestion = {
      ...question,
      answers: question.answers.map(a => ({ ...a }))
    };
    this.displayEditQuestionDialog = true;
  }

  hideEditQuestionDialog() {
    this.displayEditQuestionDialog = false;
  }

  async saveQuestion() {
    if (this.selectedTest) {
      try {
        // Validate answers
        const correctAnswers = this.newQuestion.answers.filter(a => a.isCorrect).length;
        if (correctAnswers !== 1) {
          alert('Vui lòng chọn đúng một câu trả lời đúng');
          return;
        }
        if (this.newQuestion.answers.length > 4) {
          alert('Tối đa 4 câu trả lời được phép');
          return;
        }

        const questionToSave = {
          testId: this.selectedTest.id,
          questionType: parseInt(this.newQuestion.questionType.toString(), 10),
          content: this.newQuestion.content,
          answers: this.newQuestion.answers.map(a => ({
            content: a.content,
            isCorrect: a.isCorrect
          }))
        };
        console.log('Saving question:', JSON.stringify(questionToSave, null, 2));
        const savedQuestion = await this.quizService.questionCreate(questionToSave);
        this.selectedTest.questions.push(savedQuestion);
        this.displayQuestionDialog = false;
        alert('Đã thêm câu hỏi mới');
      } catch (error) {
        console.error('Error saving question:', error);
        alert('Lỗi khi lưu câu hỏi: ' + (error.message || 'Unknown error'));
      }
    }
  }

  async updateQuestion() {
    if (this.selectedTest && this.editQuestion.id) {
      try {
        // Validate answers
        const correctAnswers = this.editQuestion.answers.filter(a => a.isCorrect).length;
        if (correctAnswers !== 1) {
          alert('Vui lòng chọn đúng một câu trả lời đúng');
          return;
        }
        if (this.editQuestion.answers.length > 4) {
          alert('Tối đa 4 câu trả lời được phép');
          return;
        }

        const questionToSave = {
          id: this.editQuestion.id,
          testId: this.selectedTest.id,
          questionType: parseInt(this.editQuestion.questionType.toString(), 10),
          content: this.editQuestion.content,
          answers: this.editQuestion.answers.map(a => ({
            id: a.id,
            content: a.content,
            isCorrect: a.isCorrect
          }))
        };
        console.log('Updating question:', JSON.stringify(questionToSave, null, 2));
        const updatedQuestion = await this.quizService.updateQuestion(questionToSave);
        const index = this.selectedTest.questions.findIndex(q => q.id === updatedQuestion.id);
        if (index !== -1) {
          this.selectedTest.questions[index] = updatedQuestion;
        }
        this.displayEditQuestionDialog = false;
        alert('Đã cập nhật câu hỏi');
      } catch (error) {
        console.error('Error updating question:', error);
        alert('Lỗi khi cập nhật câu hỏi: ' + (error.message || 'Unknown error'));
      }
    }
  }

  async deleteQuestion(questionId: number) {
    if (confirm('Bạn có chắc muốn xóa câu hỏi này?')) {
      try {
        await this.quizService.deleteQuestion(questionId);
        if (this.selectedTest) {
          this.selectedTest.questions = this.selectedTest.questions.filter(q => q.id !== questionId);
        }
        alert('Đã xóa câu hỏi');
      } catch (error) {
        console.error('Error deleting question:', error);
        alert('Lỗi khi xóa câu hỏi: ' + (error.message || 'Unknown error'));
      }
    }
  }

  showImportDialog() {
    this.displayImportDialog = true;
  }

  hideImportDialog() {
    this.displayImportDialog = false;
  }

  addAnswer(isEdit: boolean = false) {
    const target = isEdit ? this.editQuestion : this.newQuestion;
    if (target.answers.length < 4) {
      target.answers.push({ content: '', isCorrect: false });
    }
  }

  removeAnswer(index: number, isEdit: boolean = false) {
    const target = isEdit ? this.editQuestion : this.newQuestion;
    if (target.answers.length > 1) {
      target.answers.splice(index, 1);
    }
  }

  setCorrectAnswer(index: number, isEdit: boolean = false) {
    const target = isEdit ? this.editQuestion : this.newQuestion;
    target.answers = target.answers.map((answer, i) => ({
      ...answer,
      isCorrect: i === index
    }));
  }

  async importQuestions(event: any) {
    if (!this.selectedTest) return;
    const file = event.target.files[0];
    if (!file) return;
    try {
      const reader = new FileReader();
      reader.onload = async (e: any) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        for (const row of jsonData) {
          const question: Question = {
            testId: this.selectedTest!.id,
            questionType: row['QuestionType'] || 1,
            content: row['Content'],
            answers: [
              { content: row['Answer1'], isCorrect: row['CorrectAnswer'] == 1 },
              { content: row['Answer2'], isCorrect: row['CorrectAnswer'] == 2 },
              { content: row['Answer3'], isCorrect: row['CorrectAnswer'] == 3 },
              { content: row['Answer4'], isCorrect: row['CorrectAnswer'] == 4 }
            ].filter(answer => answer.content)
          };
          // Validate answers
          const correctAnswers = question.answers.filter(a => a.isCorrect).length;
          if (correctAnswers !== 1) {
            alert(`Câu hỏi "${question.content}" phải có đúng một câu trả lời đúng`);
            continue;
          }
          if (question.answers.length > 4) {
            alert(`Câu hỏi "${question.content}" không được có quá 4 câu trả lời`);
            continue;
          }
          try {
            const savedQuestion = await this.quizService.questionCreate(question);
            this.selectedTest!.questions.push(savedQuestion);
          } catch (error) {
            console.error('Error importing question:', error);
            alert(`Lỗi khi nhập câu hỏi: ${question.content}`);
          }
        }
        this.cdr.detectChanges();
        this.hideImportDialog();
        alert('Đã nhập câu hỏi thành công');
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Error reading file:', error);
      alert('Lỗi khi đọc file Excel');
    }
  }
}