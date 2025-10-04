import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LeadFormPage } from './pages/lead-form-page/lead-form-page';
import { ThankYouPage } from './pages/thank-you-page/thank-you-page';

const routes: Routes = [
  {
    path: '',
    component: LeadFormPage
  },
  {
    path: 'thank-you',
    component: ThankYouPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LeadCaptureFunnelRoutingModule { }
