import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LeadFormPage } from './pages/lead-form-page/lead-form-page';

const routes: Routes = [
  {
    path: '',
    component: LeadFormPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LeadFormRoutingModule { }
