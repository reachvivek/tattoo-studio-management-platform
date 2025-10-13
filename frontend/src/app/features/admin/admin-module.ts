import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { AdminRoutingModule } from './admin-routing-module';
import { SharedModule } from '../../shared/shared-module';
import { Login } from './pages/login/login';
import { Dashboard } from './pages/dashboard/dashboard';
import { LeadDetail } from './pages/lead-detail/lead-detail';
import { Analytics } from './pages/analytics/analytics';
import { AdminLayout } from './layout/admin-layout';
import { authInterceptor } from './interceptors/auth-interceptor';


@NgModule({
  declarations: [
    Login,
    Dashboard,
    LeadDetail,
    Analytics,
    AdminLayout
  ],
  imports: [
    CommonModule,
    FormsModule,
    SharedModule,
    AdminRoutingModule
  ],
  providers: [
    provideHttpClient(withInterceptors([authInterceptor]))
  ]
})
export class AdminModule { }
