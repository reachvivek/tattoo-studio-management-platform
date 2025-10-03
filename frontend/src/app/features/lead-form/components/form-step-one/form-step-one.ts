import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LeadService } from '../../../../core/services/lead';
import { CreateLeadRequest } from '../../../../core/models/lead.model';

@Component({
  selector: 'app-form-step-one',
  standalone: false,
  templateUrl: './form-step-one.html',
  styleUrl: './form-step-one.scss'
})
export class FormStepOne implements OnInit {
  @Output() formSubmitted = new EventEmitter<string>();

  leadForm!: FormGroup;
  selectedFiles: File[] = [];
  isLoading = false;
  error = '';

  constructor(
    private fb: FormBuilder,
    private leadService: LeadService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.leadForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      whatsappCountryCode: ['+49', Validators.required],
      whatsappNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{10,15}$/)]],
      tattooDescription: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  onFilesSelected(files: File[]): void {
    this.selectedFiles = files;
  }

  onFileError(error: string): void {
    this.error = error;
  }

  async onSubmit(): Promise<void> {
    if (this.leadForm.invalid) {
      Object.keys(this.leadForm.controls).forEach(key => {
        this.leadForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isLoading = true;
    this.error = '';

    try {
      // Upload images first if any
      let imageUrls: string[] = [];
      if (this.selectedFiles.length > 0) {
        const uploadResponse = await this.leadService.uploadImages(this.selectedFiles).toPromise();
        if (uploadResponse.success) {
          imageUrls = uploadResponse.data.urls;
        }
      }

      // Create lead
      const leadData: CreateLeadRequest = {
        ...this.leadForm.value,
        referenceImages: imageUrls
      };

      const response = await this.leadService.createLead(leadData).toPromise();

      if (response?.success) {
        // Emit event with user name to show spin wheel instead of navigating directly
        this.formSubmitted.emit(this.leadForm.value.name);
      } else {
        this.error = response?.error || 'Ein Fehler ist aufgetreten';
      }
    } catch (err: any) {
      this.error = err?.error?.error?.message || 'Netzwerkfehler. Bitte versuche es erneut.';
    } finally {
      this.isLoading = false;
    }
  }

  getErrorMessage(field: string): string {
    const control = this.leadForm.get(field);
    if (!control || !control.touched || !control.errors) return '';

    if (control.errors['required']) return 'Dieses Feld ist erforderlich';
    if (control.errors['email']) return 'Ungültige E-Mail-Adresse';
    if (control.errors['minlength']) return `Mindestens ${control.errors['minlength'].requiredLength} Zeichen erforderlich`;
    if (control.errors['pattern']) return 'Ungültiges Format';

    return '';
  }
}
