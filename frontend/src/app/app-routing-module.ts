import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./features/lead-form/lead-form-module').then(m => m.LeadFormModule)
  },
  {
    path: 'thank-you',
    loadChildren: () => import('./features/thank-you/thank-you-module').then(m => m.ThankYouModule)
  },
  {
    path: '**',
    redirectTo: ''
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
