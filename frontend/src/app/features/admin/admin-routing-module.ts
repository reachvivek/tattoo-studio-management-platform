import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Dashboard } from './pages/dashboard/dashboard';
import { LeadDetail } from './pages/lead-detail/lead-detail';
import { Analytics } from './pages/analytics/analytics';
import { AdminLayout } from './layout/admin-layout';
import { authGuard } from './guards/auth-guard';

const routes: Routes = [
  {
    path: 'login',
    component: Login
  },
  {
    path: '',
    component: AdminLayout,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        component: Dashboard
      },
      {
        path: 'analytics',
        component: Analytics
      },
      {
        path: 'leads/:id',
        component: LeadDetail
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
