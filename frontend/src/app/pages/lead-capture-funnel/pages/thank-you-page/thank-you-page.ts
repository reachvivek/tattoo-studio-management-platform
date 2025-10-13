import { Component, OnInit } from '@angular/core';
import { LeadCaptureStateService } from '../../services/lead-capture-state.service';
import { environment } from '../../../../../environments/environment';
import { AnalyticsTracking } from '../../../../core/services/analytics-tracking';
import { MetaPixel } from '../../../../core/services/meta-pixel';

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
  showTermsModal = false;

  constructor(
    private leadCaptureState: LeadCaptureStateService,
    private analyticsTracking: AnalyticsTracking,
    private metaPixel: MetaPixel
  ) {}

  ngOnInit(): void {
    const leadData = this.leadCaptureState.getLeadData();

    this.name = leadData.name || 'Teilnehmer';
    this.discountPercentage = leadData.discountPercentage || 30;

    // Track thank you page view
    this.analyticsTracking.trackPageView('Thank You Page');

    // Use the predefined WhatsApp link with the correct message
    this.whatsappLink = environment.whatsappLink;

    // Auto-open WhatsApp after 5 seconds delay (same tab for mobile compatibility)
    setTimeout(() => {
      // Track WhatsApp redirect - FINAL CONVERSION!
      this.analyticsTracking.trackWhatsAppRedirect(this.whatsappNumber, 'Thank you page redirect');
      this.metaPixel.trackWhatsAppRedirect(this.whatsappNumber);

      window.location.href = this.whatsappLink;
    }, 5000);
  }
}
