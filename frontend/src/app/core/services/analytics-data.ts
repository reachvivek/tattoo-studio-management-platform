import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface FunnelStats {
  funnel_steps: {
    total_sessions: number;
    visited_landing: number;
    submitted_form: number;
    viewed_wheel: number;
    spun_wheel: number;
    claimed_prize: number;
    whatsapp_redirect: number;
  };
  conversion_rates: {
    landing_to_form: string;
    form_to_wheel: string;
    wheel_to_spin: string;
    spin_to_claim: string;
    claim_to_whatsapp: string;
    overall_conversion: string;
  };
}

export interface DailyAnalytics {
  date: string;
  total_sessions: number;
  page_views: number;
  form_starts: number;
  wheel_spins: number;
  form_submits: number;
  conversions: number;
}

export interface TrafficSource {
  source: string;
  medium: string;
  campaign: string;
  sessions: number;
  conversions: number;
  conversion_rate: number;
}

export interface DeviceStats {
  devices: Array<{
    device_type: string;
    sessions: number;
    conversions: number;
    avg_conversion_time: number;
  }>;
  browsers: Array<{
    browser: string;
    sessions: number;
    conversions: number;
  }>;
}

export interface DropOffAnalysis {
  dropped_at_landing: number;
  dropped_at_form: number;
  dropped_at_wheel: number;
  dropped_at_spin: number;
  dropped_at_claim: number;
  total_sessions: number;
}

export interface RealTimeStats {
  stats: {
    active_sessions: number;
    recent_events: number;
    current_visitors: number;
    recent_conversions: number;
  };
  recent_events: Array<{
    event_type: string;
    page_url: string;
    created_at: string;
    device_type: string;
    utm_source: string;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsData {
  private apiUrl = `${environment.apiUrl}/analytics-detailed`;

  constructor(private http: HttpClient) {}

  getFunnelStats(startDate?: string, endDate?: string): Observable<{ success: boolean; data: FunnelStats }> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    // Add timezone offset (e.g., "+02:00" or "-05:00")
    const timezoneOffset = this.getTimezoneOffset();
    params = params.set('timezone', timezoneOffset);
    // Add cache buster
    params = params.set('_t', Date.now().toString());

    return this.http.get<{ success: boolean; data: FunnelStats }>(`${this.apiUrl}/funnel-stats`, {
      params,
      headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
    });
  }

  getDailyAnalytics(startDate?: string, endDate?: string): Observable<{ success: boolean; data: DailyAnalytics[] }> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    const timezoneOffset = this.getTimezoneOffset();
    params = params.set('timezone', timezoneOffset);
    // Add cache buster
    params = params.set('_t', Date.now().toString());

    return this.http.get<{ success: boolean; data: DailyAnalytics[] }>(`${this.apiUrl}/daily`, {
      params,
      headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
    });
  }

  getTrafficSources(startDate?: string, endDate?: string): Observable<{ success: boolean; data: TrafficSource[] }> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    const timezoneOffset = this.getTimezoneOffset();
    params = params.set('timezone', timezoneOffset);
    // Add cache buster
    params = params.set('_t', Date.now().toString());

    return this.http.get<{ success: boolean; data: TrafficSource[] }>(`${this.apiUrl}/traffic-sources`, {
      params,
      headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
    });
  }

  getDeviceStats(startDate?: string, endDate?: string): Observable<{ success: boolean; data: DeviceStats }> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    const timezoneOffset = this.getTimezoneOffset();
    params = params.set('timezone', timezoneOffset);
    // Add cache buster
    params = params.set('_t', Date.now().toString());

    return this.http.get<{ success: boolean; data: DeviceStats }>(`${this.apiUrl}/device-stats`, {
      params,
      headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
    });
  }

  getDropOffAnalysis(startDate?: string, endDate?: string): Observable<{ success: boolean; data: DropOffAnalysis }> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    const timezoneOffset = this.getTimezoneOffset();
    params = params.set('timezone', timezoneOffset);
    // Add cache buster
    params = params.set('_t', Date.now().toString());

    return this.http.get<{ success: boolean; data: DropOffAnalysis }>(`${this.apiUrl}/drop-off`, {
      params,
      headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
    });
  }

  getRealTimeStats(): Observable<{ success: boolean; data: RealTimeStats }> {
    let params = new HttpParams();
    const timezoneOffset = this.getTimezoneOffset();
    params = params.set('timezone', timezoneOffset);
    params = params.set('_t', Date.now().toString());
    return this.http.get<{ success: boolean; data: RealTimeStats }>(`${this.apiUrl}/realtime`, {
      params,
      headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
    });
  }

  /**
   * Get timezone offset in ISO format (e.g., "+02:00", "-05:00")
   * This is used to send user's timezone to backend for proper date filtering
   */
  private getTimezoneOffset(): string {
    const offset = new Date().getTimezoneOffset();
    const hours = Math.floor(Math.abs(offset) / 60);
    const minutes = Math.abs(offset) % 60;
    const sign = offset <= 0 ? '+' : '-';
    return `${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
}
