import { Component, OnInit, OnDestroy } from '@angular/core';
import { Chart, ChartConfiguration, ChartData, registerables } from 'chart.js';
import { AnalyticsData, FunnelStats, DailyAnalytics, TrafficSource, DeviceStats, DropOffAnalysis } from '../../../core/services/analytics-data';
import { LanguageService, Language } from '../../../core/services/language.service';

// Register Chart.js components
Chart.register(...registerables);

@Component({
  selector: 'app-analytics',
  standalone: false,
  templateUrl: './analytics.html',
  styleUrl: './analytics.scss'
})
export class Analytics implements OnInit, OnDestroy {
  // Date range
  dateRange: 'today' | 'week' | 'month' | 'year' | 'custom' = 'week';
  customStartDate: string = '';
  customEndDate: string = '';

  // Data
  funnelStats: FunnelStats | null = null;
  dailyAnalytics: DailyAnalytics[] = [];
  trafficSources: TrafficSource[] = [];
  deviceStats: DeviceStats | null = null;
  dropOffAnalysis: DropOffAnalysis | null = null;

  // Loading states
  isLoading = true;
  isRefreshing = false;

  // Charts
  private charts: Chart[] = [];
  funnelChart: Chart | null = null;
  dailyChart: Chart | null = null;
  trafficChart: Chart | null = null;
  deviceChart: Chart | null = null;
  conversionChart: Chart | null = null;

  // Mock data flag (will use this until backend is ready)
  useMockData = false;
  // Expose Math to template
  Math = Math;
  // Language
  language: Language = 'de'; // Default to German

  // Translations
  translations = {
    en: {
      title: 'Analytics Dashboard',
      subtitle: 'Lead Generation Performance',
      refresh: 'Refresh',
      logout: 'Logout',
      today: 'Today',
      thisWeek: 'This Week',
      thisMonth: 'This Month',
      thisYear: 'This Year',
      custom: 'Custom',
      from: 'From:',
      to: 'To:',
      apply: 'Apply',
      totalSessions: 'Total Sessions',
      formSubmits: 'Form Submits',
      wheelSpins: 'Wheel Spins',
      whatsappRedirects: 'WhatsApp Redirects',
      conversion: 'conversion',
      engagement: 'engagement',
      overall: 'overall',
      trafficSources: 'Traffic Sources',
      devicePerformance: 'Device Performance',
      dropOffAnalysis: 'Drop-off Analysis',
      landingPage: 'Landing Page',
      formStart: 'Form Start',
      wheelView: 'Wheel View',
      wheelSpin: 'Wheel Spin',
      beforeWhatsApp: 'Before WhatsApp Redirect',
      dropped: 'dropped',
      tooltips: {
        totalSessions: 'Total number of unique visitors who started a session on your website',
        formSubmits: 'Number of users who completed and submitted the lead capture form',
        wheelSpins: 'Number of users who spun the prize wheel after form submission',
        whatsappRedirects: 'Number of users who clicked the WhatsApp button to contact you',
        dropOff: 'Shows where users are leaving your funnel. High drop-off indicates areas needing improvement'
      }
    },
    de: {
      title: 'Analytics Dashboard',
      subtitle: 'Lead-Generierung Performance',
      refresh: 'Aktualisieren',
      logout: 'Abmelden',
      today: 'Heute',
      thisWeek: 'Diese Woche',
      thisMonth: 'Dieser Monat',
      thisYear: 'Dieses Jahr',
      custom: 'Benutzerdefiniert',
      from: 'Von:',
      to: 'Bis:',
      apply: 'Anwenden',
      totalSessions: 'Gesamt-Sitzungen',
      formSubmits: 'Formular-Übermittlungen',
      wheelSpins: 'Rad-Drehungen',
      whatsappRedirects: 'WhatsApp-Weiterleitungen',
      conversion: 'Konversion',
      engagement: 'Engagement',
      overall: 'insgesamt',
      trafficSources: 'Traffic-Quellen',
      devicePerformance: 'Geräteleistung',
      dropOffAnalysis: 'Abbruch-Analyse',
      landingPage: 'Landingpage',
      formStart: 'Formularstart',
      wheelView: 'Radansicht',
      wheelSpin: 'Rad-Drehung',
      beforeWhatsApp: 'Vor WhatsApp-Weiterleitung',
      dropped: 'abgebrochen',
      tooltips: {
        totalSessions: 'Gesamtzahl der eindeutigen Besucher, die eine Sitzung auf Ihrer Website gestartet haben',
        formSubmits: 'Anzahl der Benutzer, die das Lead-Erfassungsformular ausgefüllt und abgeschickt haben',
        wheelSpins: 'Anzahl der Benutzer, die nach dem Absenden des Formulars das Preisrad gedreht haben',
        whatsappRedirects: 'Anzahl der Benutzer, die auf die WhatsApp-Schaltfläche geklickt haben, um Sie zu kontaktieren',
        dropOff: 'Zeigt an, wo Benutzer Ihren Funnel verlassen. Hohe Abbruchrate deutet auf verbesserungsbedürftige Bereiche hin'
      }
    }
  };

  constructor(
    private analyticsDataService: AnalyticsData,
    private languageService: LanguageService
  ) {}

  t(key: string): string {
    return this.languageService.translate(key, this.translations);
  }

  ngOnInit(): void {
    this.languageService.currentLanguage$.subscribe(lang => {
      this.language = lang;
    });
    this.loadAnalyticsData();
  }

  ngOnDestroy(): void {
    // Clean up charts
    this.charts.forEach(chart => chart.destroy());
  }

  loadAnalyticsData(): void {
    this.isLoading = true;

    if (this.useMockData) {
      // Use mock data for demonstration
      setTimeout(() => {
        this.loadMockData();
        this.isLoading = false;
        setTimeout(() => this.initializeCharts(), 100);
      }, 500);
    } else {
      // Use real API data
      const { startDate, endDate } = this.getDateRange();

      Promise.all([
        this.analyticsDataService.getFunnelStats(startDate, endDate).toPromise(),
        this.analyticsDataService.getDailyAnalytics(startDate, endDate).toPromise(),
        this.analyticsDataService.getTrafficSources(startDate, endDate).toPromise(),
        this.analyticsDataService.getDeviceStats(startDate, endDate).toPromise(),
        this.analyticsDataService.getDropOffAnalysis(startDate, endDate).toPromise()
      ]).then(([funnel, daily, traffic, device, dropOff]) => {
        this.funnelStats = funnel?.data || null;
        this.dailyAnalytics = daily?.data || [];
        this.trafficSources = traffic?.data || [];
        this.deviceStats = device?.data || null;
        this.dropOffAnalysis = dropOff?.data || null;

        this.isLoading = false;
        setTimeout(() => this.initializeCharts(), 100);
      }).catch(error => {
        console.error('Error loading analytics:', error);
        this.isLoading = false;
      });
    }
  }

  loadMockData(): void {
    // Mock funnel stats
    this.funnelStats = {
      funnel_steps: {
        total_sessions: 2847,
        visited_landing: 2847,
        submitted_form: 1923,
        viewed_wheel: 1456,
        spun_wheel: 1398,
        claimed_prize: 1367,
        whatsapp_redirect: 892
      },
      conversion_rates: {
        landing_to_form: '67.54',
        form_to_wheel: '75.71',
        wheel_to_spin: '96.02',
        spin_to_claim: '97.78',
        claim_to_whatsapp: '65.25',
        overall_conversion: '31.33'
      }
    };

    // Mock daily analytics (last 7 days)
    const today = new Date();
    this.dailyAnalytics = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      this.dailyAnalytics.push({
        date: date.toISOString().split('T')[0],
        total_sessions: Math.floor(300 + Math.random() * 200),
        page_views: Math.floor(800 + Math.random() * 400),
        form_starts: Math.floor(200 + Math.random() * 100),
        wheel_spins: Math.floor(150 + Math.random() * 80),
        form_submits: Math.floor(80 + Math.random() * 50),
        conversions: Math.floor(80 + Math.random() * 50)
      });
    }

    // Mock traffic sources
    this.trafficSources = [
      { source: 'facebook', medium: 'cpc', campaign: 'winter2025', sessions: 1234, conversions: 456, conversion_rate: 36.95 },
      { source: 'google', medium: 'cpc', campaign: 'tattoo_giveaway', sessions: 892, conversions: 287, conversion_rate: 32.17 },
      { source: 'instagram', medium: 'social', campaign: 'organic', sessions: 456, conversions: 123, conversion_rate: 26.97 },
      { source: 'direct', medium: 'none', campaign: 'none', sessions: 265, conversions: 89, conversion_rate: 33.58 }
    ];

    // Mock device stats
    this.deviceStats = {
      devices: [
        { device_type: 'mobile', sessions: 1678, conversions: 512, avg_conversion_time: 245 },
        { device_type: 'desktop', sessions: 982, conversions: 324, avg_conversion_time: 189 },
        { device_type: 'tablet', sessions: 187, conversions: 56, avg_conversion_time: 267 }
      ],
      browsers: [
        { browser: 'Chrome', sessions: 1823, conversions: 598 },
        { browser: 'Safari', sessions: 687, conversions: 201 },
        { browser: 'Firefox', sessions: 234, conversions: 67 },
        { browser: 'Edge', sessions: 103, conversions: 26 }
      ]
    };

    // Mock drop-off analysis
    this.dropOffAnalysis = {
      dropped_at_landing: 924,
      dropped_at_form: 467,
      dropped_at_wheel: 58,
      dropped_at_spin: 31,
      dropped_at_claim: 475,
      total_sessions: 2847
    };
  }

  getDateRange(): { startDate?: string; endDate?: string } {
    const today = new Date();
    const endDate = today.toISOString().split('T')[0];
    let startDate: string | undefined;

    switch (this.dateRange) {
      case 'today':
        startDate = endDate;
        break;
      case 'week':
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        startDate = weekAgo.toISOString().split('T')[0];
        break;
      case 'month':
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        startDate = monthAgo.toISOString().split('T')[0];
        break;
      case 'year':
        const yearAgo = new Date(today);
        yearAgo.setFullYear(yearAgo.getFullYear() - 1);
        startDate = yearAgo.toISOString().split('T')[0];
        break;
      case 'custom':
        startDate = this.customStartDate || undefined;
        return { startDate, endDate: this.customEndDate || endDate };
    }

    return { startDate, endDate };
  }

  onDateRangeChange(): void {
    this.loadAnalyticsData();
  }

  applyCustomDateRange(): void {
    if (this.customStartDate && this.customEndDate) {
      this.dateRange = 'custom';
      this.loadAnalyticsData();
    }
  }

  initializeCharts(): void {
    // Destroy existing charts
    this.charts.forEach(chart => chart.destroy());
    this.charts = [];

    // Initialize all charts
    this.createFunnelChart();
    this.createDailyChart();
    this.createTrafficChart();
    this.createDeviceChart();
    this.createConversionChart();
  }

  createFunnelChart(): void {
    const canvas = document.getElementById('funnelChart') as HTMLCanvasElement;
    if (!canvas || !this.funnelStats) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const steps = this.funnelStats.funnel_steps;

    this.funnelChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Landing Page', 'Form Submit', 'Wheel View', 'Wheel Spin', 'Prize Claim', 'WhatsApp'],
        datasets: [{
          label: 'Users',
          data: [
            steps.visited_landing,
            steps.submitted_form,
            steps.viewed_wheel,
            steps.spun_wheel,
            steps.claimed_prize,
            steps.whatsapp_redirect
          ],
          backgroundColor: [
            'rgba(139, 92, 246, 0.8)',
            'rgba(59, 130, 246, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(239, 68, 68, 0.8)',
            'rgba(236, 72, 153, 0.8)'
          ],
          borderColor: [
            'rgba(139, 92, 246, 1)',
            'rgba(59, 130, 246, 1)',
            'rgba(16, 185, 129, 1)',
            'rgba(245, 158, 11, 1)',
            'rgba(239, 68, 68, 1)',
            'rgba(236, 72, 153, 1)'
          ],
          borderWidth: 2,
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: 'Conversion Funnel',
            color: '#e5e7eb',
            font: {
              size: 16,
              weight: 'bold'
            }
          },
          tooltip: {
            backgroundColor: 'rgba(17, 24, 39, 0.95)',
            titleColor: '#e5e7eb',
            bodyColor: '#e5e7eb',
            borderColor: '#374151',
            borderWidth: 1,
            padding: 12,
            displayColors: false,
            callbacks: {
              label: (context: any) => {
                const value = context.parsed.y;
                const total = steps.total_sessions;
                const percentage = ((value / total) * 100).toFixed(2);
                return `${value.toLocaleString()} users (${percentage}% of total)`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: '#9ca3af'
            },
            grid: {
              color: 'rgba(75, 85, 99, 0.3)'
            }
          },
          x: {
            ticks: {
              color: '#9ca3af'
            },
            grid: {
              display: false
            }
          }
        }
      }
    });

    this.charts.push(this.funnelChart);
  }

  createDailyChart(): void {
    const canvas = document.getElementById('dailyChart') as HTMLCanvasElement;
    if (!canvas || this.dailyAnalytics.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const labels = this.dailyAnalytics.map(d => {
      const date = new Date(d.date);
      return date.toLocaleDateString('de-DE', { month: 'short', day: 'numeric' });
    });

    this.dailyChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Sessions',
            data: this.dailyAnalytics.map(d => d.total_sessions),
            borderColor: 'rgba(139, 92, 246, 1)',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'Form Starts',
            data: this.dailyAnalytics.map(d => d.form_starts),
            borderColor: 'rgba(59, 130, 246, 1)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'Conversions',
            data: this.dailyAnalytics.map(d => d.conversions),
            borderColor: 'rgba(16, 185, 129, 1)',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.4,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              color: '#e5e7eb',
              usePointStyle: true,
              padding: 15
            }
          },
          title: {
            display: true,
            text: 'Daily Trends',
            color: '#e5e7eb',
            font: {
              size: 16,
              weight: 'bold'
            }
          },
          tooltip: {
            backgroundColor: 'rgba(17, 24, 39, 0.95)',
            titleColor: '#e5e7eb',
            bodyColor: '#e5e7eb',
            borderColor: '#374151',
            borderWidth: 1,
            padding: 12
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: '#9ca3af'
            },
            grid: {
              color: 'rgba(75, 85, 99, 0.3)'
            }
          },
          x: {
            ticks: {
              color: '#9ca3af'
            },
            grid: {
              color: 'rgba(75, 85, 99, 0.3)'
            }
          }
        }
      }
    });

    this.charts.push(this.dailyChart);
  }

  createTrafficChart(): void {
    const canvas = document.getElementById('trafficChart') as HTMLCanvasElement;
    if (!canvas || this.trafficSources.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    this.trafficChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: this.trafficSources.map(t => `${t.source} (${t.medium})`),
        datasets: [{
          data: this.trafficSources.map(t => t.sessions),
          backgroundColor: [
            'rgba(139, 92, 246, 0.8)',
            'rgba(59, 130, 246, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(239, 68, 68, 0.8)',
            'rgba(236, 72, 153, 0.8)'
          ],
          borderColor: '#1f2937',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              color: '#e5e7eb',
              padding: 15,
              usePointStyle: true
            }
          },
          title: {
            display: true,
            text: 'Traffic Sources',
            color: '#e5e7eb',
            font: {
              size: 16,
              weight: 'bold'
            }
          },
          tooltip: {
            backgroundColor: 'rgba(17, 24, 39, 0.95)',
            titleColor: '#e5e7eb',
            bodyColor: '#e5e7eb',
            borderColor: '#374151',
            borderWidth: 1,
            padding: 12,
            callbacks: {
              label: (context: any) => {
                const value = context.parsed;
                const total = this.trafficSources.reduce((sum, t) => sum + t.sessions, 0);
                const percentage = ((value / total) * 100).toFixed(2);
                return `${value.toLocaleString()} sessions (${percentage}%)`;
              }
            }
          }
        }
      }
    });

    this.charts.push(this.trafficChart);
  }

  createDeviceChart(): void {
    const canvas = document.getElementById('deviceChart') as HTMLCanvasElement;
    if (!canvas || !this.deviceStats) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    this.deviceChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: this.deviceStats.devices.map(d => d.device_type.charAt(0).toUpperCase() + d.device_type.slice(1)),
        datasets: [{
          data: this.deviceStats.devices.map(d => d.sessions),
          backgroundColor: [
            'rgba(139, 92, 246, 0.8)',
            'rgba(59, 130, 246, 0.8)',
            'rgba(16, 185, 129, 0.8)'
          ],
          borderColor: '#1f2937',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              color: '#e5e7eb',
              padding: 15,
              usePointStyle: true
            }
          },
          title: {
            display: true,
            text: 'Device Types',
            color: '#e5e7eb',
            font: {
              size: 16,
              weight: 'bold'
            }
          },
          tooltip: {
            backgroundColor: 'rgba(17, 24, 39, 0.95)',
            titleColor: '#e5e7eb',
            bodyColor: '#e5e7eb',
            borderColor: '#374151',
            borderWidth: 1,
            padding: 12,
            callbacks: {
              label: (context: any) => {
                const value = context.parsed;
                const total = this.deviceStats!.devices.reduce((sum, d) => sum + d.sessions, 0);
                const percentage = ((value / total) * 100).toFixed(2);
                return `${value.toLocaleString()} sessions (${percentage}%)`;
              }
            }
          }
        }
      }
    });

    this.charts.push(this.deviceChart);
  }

  createConversionChart(): void {
    const canvas = document.getElementById('conversionChart') as HTMLCanvasElement;
    if (!canvas || !this.funnelStats) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rates = this.funnelStats.conversion_rates;

    this.conversionChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Landing → Form', 'Form → Wheel', 'Wheel → Spin', 'Spin → Claim', 'Claim → WhatsApp', 'Overall'],
        datasets: [{
          label: 'Conversion Rate (%)',
          data: [
            parseFloat(rates.landing_to_form),
            parseFloat(rates.form_to_wheel),
            parseFloat(rates.wheel_to_spin),
            parseFloat(rates.spin_to_claim),
            parseFloat(rates.claim_to_whatsapp),
            parseFloat(rates.overall_conversion)
          ],
          backgroundColor: 'rgba(16, 185, 129, 0.8)',
          borderColor: 'rgba(16, 185, 129, 1)',
          borderWidth: 2,
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: 'Conversion Rates',
            color: '#e5e7eb',
            font: {
              size: 16,
              weight: 'bold'
            }
          },
          tooltip: {
            backgroundColor: 'rgba(17, 24, 39, 0.95)',
            titleColor: '#e5e7eb',
            bodyColor: '#e5e7eb',
            borderColor: '#374151',
            borderWidth: 1,
            padding: 12,
            displayColors: false,
            callbacks: {
              label: (context: any) => `${context.parsed.y.toFixed(2)}%`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              color: '#9ca3af',
              callback: (value: any) => value + '%'
            },
            grid: {
              color: 'rgba(75, 85, 99, 0.3)'
            }
          },
          x: {
            ticks: {
              color: '#9ca3af',
              font: {
                size: 10
              }
            },
            grid: {
              display: false
            }
          }
        }
      }
    });

    this.charts.push(this.conversionChart);
  }

  refreshData(): void {
    this.isRefreshing = true;
    this.loadAnalyticsData();
    setTimeout(() => {
      this.isRefreshing = false;
    }, 1000);
  }
}
