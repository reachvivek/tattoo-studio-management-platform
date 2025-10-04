import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { LeadCaptureFunnelRoutingModule } from './lead-capture-funnel-routing.module';
import { SharedModule } from '../../shared/shared-module';

// Components
import { HeroSection } from './components/hero-section/hero-section';
import { FormStepOne } from './components/form-step-one/form-step-one';
import { RealTimeCounter } from './components/real-time-counter/real-time-counter';
import { ProgressBar } from './components/progress-bar/progress-bar';
import { SpinWheelComponent } from './components/spin-wheel/spin-wheel';

// Pages
import { LeadFormPage } from './pages/lead-form-page/lead-form-page';
import { ThankYouPage } from './pages/thank-you-page/thank-you-page';

@NgModule({
  declarations: [
    // Components
    HeroSection,
    FormStepOne,
    RealTimeCounter,
    ProgressBar,
    SpinWheelComponent,

    // Pages
    LeadFormPage,
    ThankYouPage
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LeadCaptureFunnelRoutingModule,
    SharedModule
  ]
})
export class LeadCaptureFunnelModule { }
