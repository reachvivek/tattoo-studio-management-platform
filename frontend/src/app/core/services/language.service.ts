import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type Language = 'en' | 'de';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private currentLanguageSubject: BehaviorSubject<Language>;
  public currentLanguage$: Observable<Language>;

  constructor() {
    // Get language from localStorage or default to German
    const savedLanguage = localStorage.getItem('app_language') as Language;
    const initialLanguage: Language = savedLanguage || 'de';

    this.currentLanguageSubject = new BehaviorSubject<Language>(initialLanguage);
    this.currentLanguage$ = this.currentLanguageSubject.asObservable();
  }

  getCurrentLanguage(): Language {
    return this.currentLanguageSubject.value;
  }

  setLanguage(language: Language): void {
    localStorage.setItem('app_language', language);
    this.currentLanguageSubject.next(language);
  }

  toggleLanguage(): void {
    const newLanguage: Language = this.currentLanguageSubject.value === 'en' ? 'de' : 'en';
    this.setLanguage(newLanguage);
  }

  translate(key: string, translations: any): string {
    const language = this.getCurrentLanguage();
    const keys = key.split('.');
    let value: any = translations[language];

    for (const k of keys) {
      value = value?.[k];
    }

    return value || key;
  }
}
