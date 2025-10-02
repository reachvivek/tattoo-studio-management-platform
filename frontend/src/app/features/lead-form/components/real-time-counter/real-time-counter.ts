import { Component, OnInit, OnDestroy } from '@angular/core';
import { AnalyticsService } from '../../../../core/services/analytics';
import { Subscription } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-real-time-counter',
  standalone: false,
  templateUrl: './real-time-counter.html',
  styleUrl: './real-time-counter.scss'
})
export class RealTimeCounter implements OnInit, OnDestroy {
  remainingSlots = environment.totalSlots;
  totalSlots = environment.totalSlots;
  private subscription?: Subscription;

  constructor(private analyticsService: AnalyticsService) {}

  ngOnInit(): void {
    this.analyticsService.refreshStats();
    this.subscription = this.analyticsService.stats$.subscribe(stats => {
      if (stats) {
        this.remainingSlots = stats.remaining_slots;
      }
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  get percentage(): number {
    return ((this.totalSlots - this.remainingSlots) / this.totalSlots) * 100;
  }
}
