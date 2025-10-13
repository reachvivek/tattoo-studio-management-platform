import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { v4 as uuidv4 } from 'uuid';

export interface AnalyticsEvent {
  sessionId: string;
  eventType: string;
  eventCategory?: string;
  eventLabel?: string;
  pageUrl?: string;
  pageTitle?: string;
  metadata?: any;
  timeOnPage?: number;
  scrollDepth?: number;
}

export interface AnalyticsSession {
  sessionId: string;
  userFingerprint?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  referrer?: string;
  landingPage?: string;
  browser?: string;
  deviceType?: string;
  os?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsTracking {
  private apiUrl = `${environment.apiUrl}/analytics-detailed`;
  private sessionId: string;
  private pageStartTime: number = Date.now();
  private maxScrollDepth: number = 0;
  private scrollListener: any;

  constructor(private http: HttpClient) {
    // Get or create session ID
    this.sessionId = this.getOrCreateSessionId();

    // Initialize session tracking
    this.initializeSession();

    // Track page visibility
    this.trackPageVisibility();
  }

  // Get or create a unique session ID
  private getOrCreateSessionId(): string {
    let sessionId = sessionStorage.getItem('analytics_session_id');

    if (!sessionId) {
      sessionId = uuidv4();
      sessionStorage.setItem('analytics_session_id', sessionId);
    }

    return sessionId;
  }

  // Initialize analytics session
  private initializeSession(): void {
    const urlParams = new URLSearchParams(window.location.search);
    const referrer = document.referrer;

    const sessionData: AnalyticsSession = {
      sessionId: this.sessionId,
      userFingerprint: this.generateFingerprint(),
      utmSource: urlParams.get('utm_source') || undefined,
      utmMedium: urlParams.get('utm_medium') || undefined,
      utmCampaign: urlParams.get('utm_campaign') || undefined,
      utmContent: urlParams.get('utm_content') || undefined,
      utmTerm: urlParams.get('utm_term') || undefined,
      referrer: referrer || undefined,
      landingPage: window.location.href,
      browser: this.detectBrowser(),
      deviceType: this.detectDeviceType(),
      os: this.detectOS()
    };

    // Send session data to backend
    this.http.post(`${this.apiUrl}/create-session`, sessionData).subscribe({
      next: () => console.log('Analytics session initialized'),
      error: (err) => console.error('Failed to initialize analytics session:', err)
    });
  }

  // Track an event
  trackEvent(
    eventType: string,
    eventCategory?: string,
    eventLabel?: string,
    metadata?: any
  ): void {
    const event: AnalyticsEvent = {
      sessionId: this.sessionId,
      eventType,
      eventCategory,
      eventLabel,
      pageUrl: window.location.href,
      pageTitle: document.title,
      metadata
    };

    this.http.post(`${this.apiUrl}/track-event`, event).subscribe({
      next: () => console.log(`Event tracked: ${eventType}`),
      error: (err) => console.error('Failed to track event:', err)
    });
  }

  // Track page view
  trackPageView(pageTitle?: string): void {
    this.pageStartTime = Date.now();
    this.maxScrollDepth = 0;

    // Setup scroll tracking
    this.setupScrollTracking();

    this.trackEvent('page_view', 'navigation', pageTitle || document.title, {
      url: window.location.href,
      referrer: document.referrer
    });
  }

  // Track page leave (time on page and scroll depth)
  trackPageLeave(): void {
    const timeOnPage = Math.floor((Date.now() - this.pageStartTime) / 1000);

    this.trackEvent('page_leave', 'navigation', document.title, {
      timeOnPage,
      scrollDepth: this.maxScrollDepth
    });

    // Remove scroll listener
    if (this.scrollListener) {
      window.removeEventListener('scroll', this.scrollListener);
    }
  }

  // Setup scroll depth tracking
  private setupScrollTracking(): void {
    if (this.scrollListener) {
      window.removeEventListener('scroll', this.scrollListener);
    }

    this.scrollListener = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrollPercent = scrollHeight > 0 ? Math.round((scrollTop / scrollHeight) * 100) : 0;

      if (scrollPercent > this.maxScrollDepth) {
        this.maxScrollDepth = scrollPercent;
      }
    };

    window.addEventListener('scroll', this.scrollListener);
  }

  // Track page visibility (user leaving tab)
  private trackPageVisibility(): void {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.trackPageLeave();
      }
    });
  }

  // Convenience methods for tracking specific events
  trackFormStart(formName: string): void {
    this.trackEvent('form_start', 'engagement', formName);
  }

  trackFormSubmit(formName: string, metadata?: any): void {
    this.trackEvent('form_submit', 'conversion', formName, metadata);
  }

  trackWheelView(): void {
    this.trackEvent('wheel_view', 'navigation', 'Lottery Wheel Page');
  }

  trackWheelSpin(prize?: any): void {
    this.trackEvent('wheel_spin', 'engagement', 'Wheel Spin', { prize });
  }

  trackPrizeClaim(prize?: any): void {
    this.trackEvent('prize_claim', 'engagement', 'Prize Claimed', { prize });
  }

  trackWhatsAppRedirect(phone?: string, message?: string): void {
    this.trackEvent('whatsapp_redirect', 'conversion', 'WhatsApp Redirect', { phone, message });
  }

  trackButtonClick(buttonLabel: string, location?: string): void {
    this.trackEvent('button_click', 'engagement', buttonLabel, { location });
  }

  trackError(errorType: string, errorMessage: string): void {
    this.trackEvent('error', 'system', errorType, { message: errorMessage });
  }

  // Generate a simple browser fingerprint
  private generateFingerprint(): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    let fingerprint = '';

    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('fingerprint', 2, 2);
      fingerprint = canvas.toDataURL();
    }

    const screen_data = `${screen.width}x${screen.height}x${screen.colorDepth}`;
    const navigator_data = navigator.userAgent + navigator.language + screen_data;

    return this.hashCode(navigator_data + fingerprint);
  }

  // Simple hash function
  private hashCode(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  // Detect browser
  private detectBrowser(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.indexOf('Firefox') > -1) return 'Firefox';
    if (userAgent.indexOf('Chrome') > -1) return 'Chrome';
    if (userAgent.indexOf('Safari') > -1) return 'Safari';
    if (userAgent.indexOf('Edge') > -1) return 'Edge';
    if (userAgent.indexOf('MSIE') > -1 || userAgent.indexOf('Trident/') > -1) return 'IE';
    return 'Unknown';
  }

  // Detect device type
  private detectDeviceType(): string {
    const userAgent = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(userAgent)) {
      return 'tablet';
    }
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(userAgent)) {
      return 'mobile';
    }
    return 'desktop';
  }

  // Detect OS
  private detectOS(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.indexOf('Win') > -1) return 'Windows';
    if (userAgent.indexOf('Mac') > -1) return 'MacOS';
    if (userAgent.indexOf('Linux') > -1) return 'Linux';
    if (userAgent.indexOf('Android') > -1) return 'Android';
    if (userAgent.indexOf('iOS') > -1) return 'iOS';
    return 'Unknown';
  }

  // Get session ID for linking with lead submission
  getSessionId(): string {
    return this.sessionId;
  }
}
