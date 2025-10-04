import { Component, OnInit } from '@angular/core';
import { LeadCaptureStateService } from '../../services/lead-capture-state.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-thank-you-page',
  standalone: false,
  templateUrl: './thank-you-page.html',
  styleUrl: './thank-you-page.scss'
})
export class ThankYouPage implements OnInit {
  name = '';
  discountPercentage = 30;
  whatsappLink = '';
  whatsappNumber = environment.whatsappNumber;

  constructor(private leadCaptureState: LeadCaptureStateService) {}

  ngOnInit(): void {
    const leadData = this.leadCaptureState.getLeadData();

    this.name = leadData.name || 'Teilnehmer';
    this.discountPercentage = leadData.discountPercentage || 30;

    // Generate WhatsApp link to business number (not user's number)
    const message = encodeURIComponent(
      `Hallo! Ich habe gerade einen ${this.discountPercentage}% Gutschein gewonnen und möchte diesen aktivieren.`
    );

    this.whatsappLink = `https://wa.me/${environment.whatsappNumber.replace(/\s+/g, '')}?text=${message}`;

    // Auto-open WhatsApp in new tab
    // Using setTimeout and creating an anchor element to avoid popup blockers
    setTimeout(() => {
      const link = document.createElement('a');
      link.href = this.whatsappLink;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }, 500);
  }
}
