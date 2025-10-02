import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ThankYouRoutingModule } from './thank-you-routing-module';
import { ThankYouPage } from './pages/thank-you-page/thank-you-page';


@NgModule({
  declarations: [
    ThankYouPage
  ],
  imports: [
    CommonModule,
    ThankYouRoutingModule
  ]
})
export class ThankYouModule { }
