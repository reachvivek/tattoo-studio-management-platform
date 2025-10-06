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
}
