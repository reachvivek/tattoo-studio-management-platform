import { Component, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '../services/auth';
import { LanguageService, Language } from '../../core/services/language.service';

@Component({
  selector: 'app-admin-layout',
  standalone: false,
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.scss'
})
export class AdminLayout implements OnInit {
  sidebarOpen = false;
  sidebarCollapsed = false;
  isMobile = false;
  currentLanguage: Language = 'de';

  constructor(
    private authService: Auth,
    private router: Router,
    private languageService: LanguageService
  ) {}

  ngOnInit(): void {
    this.checkMobile();
    this.languageService.currentLanguage$.subscribe(lang => {
      this.currentLanguage = lang;
    });
  }

  @HostListener('window:resize', ['$event'])
  onResize(event?: any): void {
    this.checkMobile();
  }

  checkMobile(): void {
    this.isMobile = window.innerWidth < 768;
    if (!this.isMobile) {
      this.sidebarOpen = false;
    }
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar(): void {
    if (this.isMobile) {
      this.sidebarOpen = false;
    }
  }

  toggleCollapse(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  toggleLanguage(): void {
    this.languageService.toggleLanguage();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/admin/login']);
  }

  isActive(route: string): boolean {
    return this.router.url.includes(route);
  }
}
