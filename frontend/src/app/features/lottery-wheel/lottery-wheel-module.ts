import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SpinWheelComponent } from './components/spin-wheel/spin-wheel';

@NgModule({
  declarations: [
    SpinWheelComponent
  ],
  imports: [
    CommonModule
  ],
  exports: [
    SpinWheelComponent
  ]
})
export class LotteryWheelModule { }
