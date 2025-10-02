import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api';
import { CreateLeadRequest, LeadResponse } from '../models/lead.model';

@Injectable({
  providedIn: 'root'
})
export class LeadService {
  constructor(private apiService: ApiService) {}

  createLead(lead: CreateLeadRequest): Observable<LeadResponse> {
    return this.apiService.post<LeadResponse>('/leads', lead);
  }

  uploadImages(files: File[]): Observable<any> {
    return this.apiService.uploadFiles(files);
  }
}
