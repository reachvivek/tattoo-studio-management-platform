import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LeadService } from '../../../../core/services/lead';
import { LeadCaptureStateService } from '../../services/lead-capture-state.service';
import { CreateLeadRequest } from '../../../../core/models/lead.model';
import { AnalyticsTracking } from '../../../../core/services/analytics-tracking';
import { MetaPixel } from '../../../../core/services/meta-pixel';

@Component({
  selector: 'app-form-step-one',
  standalone: false,
  templateUrl: './form-step-one.html',
  styleUrl: './form-step-one.scss',
})
export class FormStepOne implements OnInit {
  @Output() formSubmitted = new EventEmitter<string>();

  leadForm!: FormGroup;
  selectedFiles: File[] = [];
  isLoading = false;
  error = '';
  private formStartTracked = false;

  constructor(
    private fb: FormBuilder,
    private leadService: LeadService,
    private leadCaptureState: LeadCaptureStateService,
    private router: Router,
    private analyticsTracking: AnalyticsTracking,
    private metaPixel: MetaPixel
  ) {}

  ngOnInit(): void {
    // Track page view
    this.analyticsTracking.trackPageView('Lead Form Page');
    this.metaPixel.trackLandingPage();

    this.leadForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      whatsappCountryCode: ['+49', Validators.required],
      whatsappNumber: [
        '',
        [Validators.required, Validators.pattern(/^[0-9]{5,15}$/)],
      ],
      tattooDescription: [''], // Optional now
      optInChoice: ['yes'],
    });

    // Track form start when user interacts with any field
    this.leadForm.valueChanges.subscribe(() => {
      if (!this.formStartTracked) {
        this.formStartTracked = true;
        this.analyticsTracking.trackFormStart('Lead Form');
        this.metaPixel.trackFormStart();
      }
    });
  }

  onFilesSelected(files: File[]): void {
    this.selectedFiles = files;
  }

  onFileError(error: string): void {
    this.error = error;
  }

  async onSubmit(): Promise<void> {
    // Validate form
    if (this.leadForm.invalid) {
      Object.keys(this.leadForm.controls).forEach((key) => {
        this.leadForm.get(key)?.markAsTouched();
      });
      this.error = 'Bitte fülle alle erforderlichen Felder korrekt aus';
      return;
    }

    this.isLoading = true;
    this.error = '';

    try {
      // Upload images first if any
      let imageUrls: string[] = [];
      if (this.selectedFiles.length > 0) {
        const uploadResponse = await this.leadService
          .uploadImages(this.selectedFiles)
          .toPromise();
        if (uploadResponse.success) {
          imageUrls = uploadResponse.data.urls;
        }
      }

      // Create lead
      const leadData: CreateLeadRequest = {
        ...this.leadForm.value,
        referenceImages: imageUrls,
      };

      const response = await this.leadService.createLead(leadData).toPromise();

      if (response?.success) {
        // Track form submission
        const sessionId = this.analyticsTracking.getSessionId();
        this.analyticsTracking.trackFormSubmit('Lead Form', {
          email: this.leadForm.value.email,
          sessionId: sessionId
        });
        this.metaPixel.trackFormComplete(this.leadForm.value.email);
        this.metaPixel.trackLeadWithValue(this.leadForm.value.email, 'organic', 50);

        // Store form data in shared service
        this.leadCaptureState.setLeadData({
          name: this.leadForm.value.name,
          email: this.leadForm.value.email,
          whatsappCountryCode: this.leadForm.value.whatsappCountryCode,
          whatsappNumber: this.leadForm.value.whatsappNumber,
          tattooDescription: this.leadForm.value.tattooDescription,
        });

        // Emit event with user name to show spin wheel
        this.formSubmitted.emit(this.leadForm.value.name);
      } else {
        this.error = this.getUserFriendlyError(response?.error);
      }
    } catch (err: any) {
      console.error('Form submission error:', err);
      this.error = this.getUserFriendlyError(
        err?.error?.error || err?.error?.message
      );
    } finally {
      this.isLoading = false;
    }
  }

  private getUserFriendlyError(errorMessage?: string): string {
    // Don't expose technical database errors
    if (!errorMessage) {
      return 'Ein Fehler ist aufgetreten. Bitte versuche es später erneut.';
    }

    // Return validation errors as-is (they're already user-friendly)
    if (
      errorMessage.includes('Pflichtfelder') ||
      errorMessage.includes('Ungültige') ||
      errorMessage.includes('mindestens')
    ) {
      return errorMessage;
    }

    // Map technical errors to user-friendly messages
    if (
      errorMessage.includes('duplicate') ||
      errorMessage.includes('unique constraint')
    ) {
      return 'Diese E-Mail wurde bereits verwendet. Bitte verwende eine andere E-Mail-Adresse.';
    }

    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      return 'Netzwerkfehler. Bitte überprüfe deine Internetverbindung und versuche es erneut.';
    }

    if (errorMessage.includes('timeout')) {
      return 'Die Anfrage dauerte zu lange. Bitte versuche es erneut.';
    }

    // Generic error for everything else
    return 'Ein technischer Fehler ist aufgetreten. Bitte versuche es später erneut.';
  }

  onNumberKeyPress(event: KeyboardEvent): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    // Only allow numbers (0-9) and spaces
    if ((charCode < 48 || charCode > 57) && charCode !== 32) {
      event.preventDefault();
      return false;
    }
    return true;
  }

  onNumberPaste(event: ClipboardEvent): void {
    const pastedText = event.clipboardData?.getData('text') || '';
    // Only allow numbers and spaces
    if (!/^[0-9\s]*$/.test(pastedText)) {
      event.preventDefault();
    }
  }

  getErrorMessage(field: string): string {
    const control = this.leadForm.get(field);
    if (!control || !control.touched || !control.errors) return '';

    if (control.errors['required']) return 'Dieses Feld ist erforderlich';
    if (control.errors['email']) return 'Ungültige E-Mail-Adresse';
    if (control.errors['minlength'])
      return `Mindestens ${control.errors['minlength'].requiredLength} Zeichen erforderlich`;
    if (control.errors['pattern']) {
      if (field === 'whatsappNumber') {
        return 'Bitte gib 10-15 Ziffern ein (nur Zahlen)';
      }
      return 'Ungültiges Format';
    }

    return '';
  }
}
