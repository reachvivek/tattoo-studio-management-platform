import { Injectable } from '@angular/core';

// Extend Window interface to include fbq
declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    _fbq?: any;
  }
}

@Injectable({
  providedIn: 'root'
})
export class MetaPixel {
  private pixelId = '2241977412818199';

  constructor() {
    // Pixel is already initialized in index.html
  }

  // Check if pixel is loaded
  private isPixelLoaded(): boolean {
    return typeof window !== 'undefined' && typeof window.fbq === 'function';
  }

  // Track a standard event
  trackEvent(eventName: string, parameters?: any): void {
    if (this.isPixelLoaded()) {
      window.fbq!('track', eventName, parameters);
    }
  }

  // Track a custom event
  trackCustomEvent(eventName: string, parameters?: any): void {
    if (this.isPixelLoaded()) {
      window.fbq!('trackCustom', eventName, parameters);
    }
  }

  // Standard Facebook Events
  trackPageView(): void {
    this.trackEvent('PageView');
  }

  trackViewContent(contentName?: string, contentCategory?: string, value?: number): void {
    this.trackEvent('ViewContent', {
      content_name: contentName,
      content_category: contentCategory,
      value: value,
      currency: 'EUR'
    });
  }

  trackSearch(searchString?: string): void {
    this.trackEvent('Search', {
      search_string: searchString
    });
  }

  trackAddToCart(contentName?: string, value?: number): void {
    this.trackEvent('AddToCart', {
      content_name: contentName,
      value: value,
      currency: 'EUR'
    });
  }

  trackInitiateCheckout(value?: number): void {
    this.trackEvent('InitiateCheckout', {
      value: value,
      currency: 'EUR'
    });
  }

  trackLead(value?: number): void {
    this.trackEvent('Lead', {
      value: value,
      currency: 'EUR'
    });
  }

  trackCompleteRegistration(status?: string): void {
    this.trackEvent('CompleteRegistration', {
      status: status
    });
  }

  trackContact(): void {
    this.trackEvent('Contact');
  }

  trackSubmitApplication(): void {
    this.trackEvent('SubmitApplication');
  }

  // Custom Events for Tattoo Funnel
  trackLandingPage(): void {
    this.trackCustomEvent('LandingPageView', {
      page: 'Lead Form Page',
      funnel_step: 1
    });
  }

  trackFormStart(): void {
    this.trackCustomEvent('FormStart', {
      funnel_step: 2
    });
  }

  trackFormComplete(email?: string): void {
    this.trackEvent('Lead', {
      funnel_step: 3
    });
    this.trackCustomEvent('FormComplete', {
      email: email
    });
  }

  trackWheelPageView(): void {
    this.trackCustomEvent('WheelPageView', {
      funnel_step: 4
    });
  }

  trackWheelSpin(prize?: string): void {
    this.trackCustomEvent('WheelSpin', {
      prize: prize,
      funnel_step: 5
    });
  }

  trackPrizeClaim(prize?: string, discount?: number): void {
    this.trackCustomEvent('PrizeClaim', {
      prize: prize,
      discount_percentage: discount,
      funnel_step: 6
    });
  }

  trackWhatsAppRedirect(phone?: string): void {
    this.trackEvent('Contact');
    this.trackCustomEvent('WhatsAppRedirect', {
      phone: phone,
      funnel_step: 7,
      final_conversion: true
    });
  }

  // E-commerce style event for lead value
  trackLeadWithValue(email?: string, source?: string, value: number = 50): void {
    this.trackEvent('Lead', {
      content_name: 'Tattoo Lead',
      content_category: 'Lead Generation',
      value: value,
      currency: 'EUR',
      lead_source: source,
      email: email
    });
  }
}
