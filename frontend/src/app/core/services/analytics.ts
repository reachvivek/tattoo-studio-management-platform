import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ApiService } from './api';
import { StatsResponse, CampaignStats } from '../models/lead.model';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private statsSubject = new BehaviorSubject<CampaignStats | null>(null);
  public stats$ = this.statsSubject.asObservable();

  constructor(private apiService: ApiService) {}

  getStats(): Observable<StatsResponse> {
    return this.apiService.get<StatsResponse>('/analytics/stats').pipe(
      tap(response => {
        if (response.success && response.data) {
          this.statsSubject.next(response.data);
        }
      })
    );
  }

  refreshStats(): void {
    this.getStats().subscribe();
  }
}
