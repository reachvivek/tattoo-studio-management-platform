import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '../../services/auth';
import { Lead, LeadData } from '../../services/lead';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit {
  leads: LeadData[] = [];
  filteredLeads: LeadData[] = [];
  isLoading = true;
  searchTerm = '';
  statusFilter = 'all';
  showDeleteModal = false;
  leadToDelete: { id: number; name: string } | null = null;
  isDeleting = false;
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';

  // Bulk selection
  selectedLeads = new Set<number>();
  showBulkDeleteModal = false;
  isBulkDeleting = false;

  statusOptions = [
    { value: 'all', label: 'Alle' },
    { value: 'new', label: 'Neu' },
    { value: 'contacted', label: 'Kontaktiert' },
    { value: 'qualified', label: 'Qualifiziert' },
    { value: 'converted', label: 'Konvertiert' },
    { value: 'rejected', label: 'Abgelehnt' }
  ];

  constructor(
    private leadService: Lead,
    private authService: Auth,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadLeads();
  }

  loadLeads(): void {
    this.isLoading = true;
    this.leadService.getAll().subscribe({
      next: (response) => {
        if (response.success) {
          this.leads = response.data;
          this.applyFilters();
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load leads:', error);
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    this.filteredLeads = this.leads.filter(lead => {
      const matchesSearch = !this.searchTerm ||
        lead.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        lead.email.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        lead.whatsapp_number.includes(this.searchTerm);

      const matchesStatus = this.statusFilter === 'all' || lead.status === this.statusFilter;

      return matchesSearch && matchesStatus;
    });
  }

  onSearch(): void {
    this.applyFilters();
  }

  onStatusFilterChange(): void {
    this.applyFilters();
  }

  viewLead(id: number): void {
    this.router.navigate(['/admin/leads', id]);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/admin/login']);
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
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  deleteLead(id: number, name: string): void {
    this.leadToDelete = { id, name };
    this.showDeleteModal = true;
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
    this.leadToDelete = null;
    this.isDeleting = false;
  }

  confirmDelete(): void {
    if (!this.leadToDelete) return;

    this.isDeleting = true;
    const leadId = this.leadToDelete.id;

    this.leadService.delete(leadId).subscribe({
      next: (response) => {
        if (response.success) {
          // Remove the lead from the local arrays
          this.leads = this.leads.filter(lead => lead.id !== leadId);
          this.applyFilters();

          // Close modal and show success toast
          this.showDeleteModal = false;
          this.leadToDelete = null;
          this.isDeleting = false;
          this.showToastMessage('Lead wurde erfolgreich gelöscht.', 'success');
        }
      },
      error: (error) => {
        console.error('Failed to delete lead:', error);
        this.isDeleting = false;
        this.showDeleteModal = false;
        this.leadToDelete = null;
        this.showToastMessage('Fehler beim Löschen des Leads. Bitte versuchen Sie es erneut.', 'error');
      }
    });
  }

  showToastMessage(message: string, type: 'success' | 'error'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;

    // Auto-hide toast after 3 seconds
    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }

  // Bulk selection methods
  toggleLeadSelection(leadId: number): void {
    if (this.selectedLeads.has(leadId)) {
      this.selectedLeads.delete(leadId);
    } else {
      this.selectedLeads.add(leadId);
    }
  }

  toggleSelectAll(): void {
    if (this.isAllSelected()) {
      this.selectedLeads.clear();
    } else {
      this.filteredLeads.forEach(lead => this.selectedLeads.add(lead.id));
    }
  }

  isAllSelected(): boolean {
    return this.filteredLeads.length > 0 &&
           this.filteredLeads.every(lead => this.selectedLeads.has(lead.id));
  }

  isSelected(leadId: number): boolean {
    return this.selectedLeads.has(leadId);
  }

  openBulkDeleteModal(): void {
    if (this.selectedLeads.size === 0) return;
    this.showBulkDeleteModal = true;
  }

  cancelBulkDelete(): void {
    this.showBulkDeleteModal = false;
    this.isBulkDeleting = false;
  }

  confirmBulkDelete(): void {
    if (this.selectedLeads.size === 0) return;

    this.isBulkDeleting = true;
    const idsToDelete = Array.from(this.selectedLeads);

    this.leadService.bulkDelete(idsToDelete).subscribe({
      next: (response) => {
        if (response.success) {
          // Remove deleted leads from local arrays
          this.leads = this.leads.filter(lead => !this.selectedLeads.has(lead.id));
          this.applyFilters();

          // Clear selection and close modal
          this.selectedLeads.clear();
          this.showBulkDeleteModal = false;
          this.isBulkDeleting = false;

          const count = response.data?.deletedCount || idsToDelete.length;
          this.showToastMessage(`${count} Lead(s) wurden erfolgreich gelöscht.`, 'success');
        }
      },
      error: (error) => {
        console.error('Failed to bulk delete leads:', error);
        this.isBulkDeleting = false;
        this.showBulkDeleteModal = false;
        this.showToastMessage('Fehler beim Löschen der Leads. Bitte versuchen Sie es erneut.', 'error');
      }
    });
  }
}
