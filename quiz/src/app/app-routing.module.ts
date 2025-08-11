import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TestComponent } from 'src/app/components/test/test.component';
import { LoginComponent } from './components/login/login.component';
import { CodeComponent } from './components/code/code.component';

const routes: Routes = [
  {
    path: "",
    component: LoginComponent,
  },
  {
    path: "test/:code",
    component: TestComponent,
  },
  {
    path: "login",
    component: LoginComponent,
  },
  {
    path: "code",
    component: CodeComponent,
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
