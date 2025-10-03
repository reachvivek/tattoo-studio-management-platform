import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { LeadFormRoutingModule } from './lead-form-routing-module';
import { SharedModule } from '../../shared/shared-module';
import { LotteryWheelModule } from '../lottery-wheel/lottery-wheel-module';
import { HeroSection } from './components/hero-section/hero-section';
import { FormStepOne } from './components/form-step-one/form-step-one';
import { RealTimeCounter } from './components/real-time-counter/real-time-counter';
import { ProgressBar } from './components/progress-bar/progress-bar';
import { LeadFormPage } from './pages/lead-form-page/lead-form-page';

@NgModule({
  declarations: [
    HeroSection,
    FormStepOne,
    RealTimeCounter,
    ProgressBar,
    LeadFormPage
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LeadFormRoutingModule,
    SharedModule,
    LotteryWheelModule
  ]
})
export class LeadFormModule { }
