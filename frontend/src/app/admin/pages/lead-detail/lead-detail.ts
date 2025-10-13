import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Lead, LeadData } from '../../services/lead';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-lead-detail',
  standalone: false,
  templateUrl: './lead-detail.html',
  styleUrl: './lead-detail.scss'
})
export class LeadDetail implements OnInit {
  lead: LeadData | null = null;
  isLoading = true;
  isSavingStatus = false;
  selectedStatus = '';

  statusOptions = [
    { value: 'new', label: 'Neu' },
    { value: 'contacted', label: 'Kontaktiert' },
    { value: 'qualified', label: 'Qualifiziert' },
    { value: 'converted', label: 'Konvertiert' },
    { value: 'rejected', label: 'Abgelehnt' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private leadService: Lead
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadLead(parseInt(id));
    }
  }

  loadLead(id: number): void {
    this.isLoading = true;
    this.leadService.getById(id).subscribe({
      next: (response) => {
        if (response.success) {
          this.lead = response.data;
          this.selectedStatus = this.lead.status;
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load lead:', error);
        this.isLoading = false;
      }
    });
  }

  updateStatus(): void {
    if (!this.lead || this.selectedStatus === this.lead.status) return;

    this.isSavingStatus = true;
    this.leadService.updateStatus(this.lead.id, this.selectedStatus).subscribe({
      next: (response) => {
        if (response.success && this.lead) {
          this.lead.status = this.selectedStatus;
        }
        this.isSavingStatus = false;
      },
      error: (error) => {
        console.error('Failed to update status:', error);
        this.isSavingStatus = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/admin/dashboard']);
  }

  getStatusBadgeClass(status: string): string {
    const classes: Record<string, string> = {
      'new': 'bg-blue-900/20 text-blue-400 border-blue-800',
      'contacted': 'bg-yellow-900/20 text-yellow-400 border-yellow-800',
      'qualified': 'bg-purple-900/20 text-purple-400 border-purple-800',
      'converted': 'bg-green-900/20 text-green-400 border-green-800',
      'rejected': 'bg-red-900/20 text-red-400 border-red-800'
    };
    return classes[status] || 'bg-gray-900/20 text-gray-400 border-gray-800';
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  openWhatsApp(): void {
    if (this.lead) {
      const phone = `${this.lead.whatsapp_country_code}${this.lead.whatsapp_number}`.replace(/[^0-9]/g, '');
      window.open(`https://wa.me/${phone}`, '_blank');
    }
  }

  openEmail(): void {
    if (this.lead) {
      window.location.href = `mailto:${this.lead.email}`;
    }
  }

  getImageUrl(imagePath: string): string {
    // If the path is already a full URL, return it as is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }

    // If the path starts with /api/images (new blob endpoint), construct full URL
    if (imagePath.startsWith('/api/images')) {
      return `${environment.backendUrl}${imagePath}`;
    }

    // If the path starts with /uploads (legacy), convert to blob endpoint
    if (imagePath.startsWith('/uploads/')) {
      const filename = imagePath.replace('/uploads/', '');
      return `${environment.backendUrl}/api/images/${filename}`;
    }

    // Otherwise, assume it's just a filename and construct the blob endpoint URL
    return `${environment.backendUrl}/api/images/${imagePath}`;
  }
}
