import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { BaseUrl } from './baseUrl.service';

@Injectable({
  providedIn: 'root',
})
export class QuizService {
  constructor(private http: HttpClient, private baseUrl: BaseUrl) {}

  async getTestsByUserId(userId: number): Promise<any> {
    return await lastValueFrom(
      this.http.get(this.baseUrl.getUrlQuiz() + 'test/findTestByUserId/' + userId)
    );
  }

  async getTestById(testId: number): Promise<any> {
    return await lastValueFrom(
      this.http.get(this.baseUrl.getUrlQuiz() + 'test/getTestById/' + testId)
    );
  }

  async testCreate(test: any): Promise<any> {
    return await lastValueFrom(
      this.http.post(this.baseUrl.getUrlQuiz() + 'test/save', test)
    );
  }

  async updateTest(test: any): Promise<any> {
    return await lastValueFrom(
      this.http.put(this.baseUrl.getUrlQuiz() + `test/update/${test.id}`, test)
    );
  }

  async deleteTest(testId: number): Promise<void> {
    return await lastValueFrom(
      this.http.delete<void>(this.baseUrl.getUrlQuiz() + `test/delete/${testId}`)
    );
  }

  async questionCreate(question: any): Promise<any> {
    return await lastValueFrom(
      this.http.post(this.baseUrl.getUrlQuiz() + 'question/save', question)
    );
  }

  async updateQuestion(question: any): Promise<any> {
    return await lastValueFrom(
      this.http.put(this.baseUrl.getUrlQuiz() + `question/update/${question.id}`, question)
    );
  }

  async deleteQuestion(questionId: number): Promise<void> {
    return await lastValueFrom(
      this.http.delete<void>(this.baseUrl.getUrlQuiz() + `question/delete/${questionId}`)
    );
  }

  async answerCreate(answers: any[]): Promise<any> {
    return await lastValueFrom(
      this.http.post(this.baseUrl.getUrlQuiz() + 'answer/save', answers)
    );
  }
}