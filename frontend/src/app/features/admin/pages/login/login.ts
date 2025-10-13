import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '../../services/auth';
import { LanguageService, Language } from '../../../../core/services/language.service';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login implements OnInit {
  username = '';
  password = '';
  errorMessage = '';
  isLoading = false;
  currentLanguage: Language = 'de';

  translations = {
    en: {
      subtitle: 'Admin Login',
      username: 'Username',
      password: 'Password',
      usernamePlaceholder: 'Enter username',
      passwordPlaceholder: 'Enter password',
      loginButton: 'Login',
      loading: 'Loading...',
      loginError: 'Invalid username or password'
    },
    de: {
      subtitle: 'Admin Login',
      username: 'Benutzername',
      password: 'Passwort',
      usernamePlaceholder: 'Benutzername eingeben',
      passwordPlaceholder: 'Passwort eingeben',
      loginButton: 'Anmelden',
      loading: 'Wird geladen...',
      loginError: 'Ungültiger Benutzername oder Passwort'
    }
  };

  constructor(
    private authService: Auth,
    private router: Router,
    private languageService: LanguageService
  ) {}

  ngOnInit(): void {
    this.languageService.currentLanguage$.subscribe(lang => {
      this.currentLanguage = lang;
    });
  }

  toggleLanguage(): void {
    this.languageService.toggleLanguage();
  }

  t(key: string): string {
    return this.languageService.translate(key, this.translations);
  }

  onSubmit(): void {
    if (!this.username || !this.password) {
      this.errorMessage = this.t('loginError');
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.username, this.password).subscribe({
      next: (response) => {
        if (response.success) {
          this.router.navigate(['/admin/dashboard']);
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.error || this.t('loginError');
      }
    });
  }
}
