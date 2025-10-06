import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface LeadData {
  id: number;
  name: string;
  email: string;
  whatsapp_country_code: string;
  whatsapp_number: string;
  tattoo_description: string;
  reference_images: string[];
  discount_percentage: number;
  whatsapp_sent: boolean;
  email_sent: boolean;
  status: string;
  lead_source?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  updated_at: string;
}

interface LeadsResponse {
  success: boolean;
  data: LeadData[];
}

interface LeadResponse {
  success: boolean;
  data: LeadData;
}

@Injectable({
  providedIn: 'root'
})
export class Lead {
  constructor(private http: HttpClient) {}

  private getHeaders() {
    const token = localStorage.getItem('adminToken');
    return {
      headers: {
        'Authorization': token ? `Bearer ${token}` : ''
      }
    };
  }

  getAll(): Observable<LeadsResponse> {
    return this.http.get<LeadsResponse>(`${environment.apiUrl}/leads`, this.getHeaders());
  }

  getById(id: number): Observable<LeadResponse> {
    return this.http.get<LeadResponse>(`${environment.apiUrl}/leads/${id}`, this.getHeaders());
  }

  updateStatus(id: number, status: string): Observable<LeadResponse> {
    return this.http.patch<LeadResponse>(`${environment.apiUrl}/leads/${id}/status`, { status }, this.getHeaders());
  }
}
