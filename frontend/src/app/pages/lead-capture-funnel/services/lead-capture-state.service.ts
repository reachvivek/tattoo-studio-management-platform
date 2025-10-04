import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface LeadCaptureData {
  name: string;
  email: string;
  whatsappCountryCode: string;
  whatsappNumber: string;
  tattooDescription: string;
  referenceImages?: string[];
  discountPercentage: number;
}

@Injectable({
  providedIn: 'root'
})
export class LeadCaptureStateService {
  private leadDataSubject = new BehaviorSubject<Partial<LeadCaptureData>>({});
  public leadData$: Observable<Partial<LeadCaptureData>> = this.leadDataSubject.asObservable();

  constructor() {}

  setLeadData(data: Partial<LeadCaptureData>): void {
    const currentData = this.leadDataSubject.value;
    this.leadDataSubject.next({ ...currentData, ...data });
  }

  getLeadData(): Partial<LeadCaptureData> {
    return this.leadDataSubject.value;
  }

  setDiscount(percentage: number): void {
    this.setLeadData({ discountPercentage: percentage });
  }

  clearLeadData(): void {
    this.leadDataSubject.next({});
  }

  getWhatsAppLink(): string {
    const data = this.leadDataSubject.value;
    const phone = `${data.whatsappCountryCode}${data.whatsappNumber}`.replace(/\s+/g, '');
    const message = encodeURIComponent(
      `Hallo! Ich habe gerade einen ${data.discountPercentage}% Gutschein gewonnen und möchte diesen aktivieren.`
    );
    return `https://wa.me/${phone}?text=${message}`;
  }
}
