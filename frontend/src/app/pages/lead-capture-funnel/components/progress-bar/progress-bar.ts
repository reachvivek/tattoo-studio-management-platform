import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-progress-bar',
  standalone: false,
  templateUrl: './progress-bar.html',
  styleUrl: './progress-bar.scss'
})
export class ProgressBar {
  @Input() currentStep = 1;
  @Input() totalSteps = 2;

  get progress(): number {
    return (this.currentStep / this.totalSteps) * 100;
  }
}
