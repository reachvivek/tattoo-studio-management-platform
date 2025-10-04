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
    console.log('onFormSubmitted received in parent, name:', name);
    this.userName = name;
    this.showSpinWheel = true;
    console.log('showSpinWheel set to:', this.showSpinWheel);
  }

  onSpinComplete(prize: string): void {
    // Navigate to thank you page with prize info and user name
    this.router.navigate(['/thank-you'], {
      queryParams: {
        name: this.userName,
        prize: prize
      }
    });
  }
}
