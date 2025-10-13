import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-lead-form-page',
  standalone: false,
  templateUrl: './lead-form-page.html',
  styleUrl: './lead-form-page.scss'
})
export class LeadFormPage {
  showSpinWheel = false;
  userName = '';

  constructor(private router: Router) {}

  onFormSubmitted(name: string): void {
    this.userName = name;
    this.showSpinWheel = true;
  }

  onSpinComplete(prize: string): void {
    // Navigate to thank you page (data is in shared service)
    this.router.navigate(['thank-you']);
  }
}
