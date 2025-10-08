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

    // Use the predefined WhatsApp link with the correct message
    this.whatsappLink = environment.whatsappLink;

    // Auto-open WhatsApp after 5 seconds delay (same tab for mobile compatibility)
    setTimeout(() => {
      window.location.href = this.whatsappLink;
    }, 5000);
  }
}
