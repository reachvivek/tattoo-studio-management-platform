import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-thank-you-page',
  standalone: false,
  templateUrl: './thank-you-page.html',
  styleUrl: './thank-you-page.scss'
})
export class ThankYouPage implements OnInit {
  name = '';
  whatsappLink = environment.whatsappLink;
  whatsappNumber = environment.whatsappNumber;

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.name = params['name'] || 'Teilnehmer';

      // Auto-redirect to WhatsApp
      const message = `Hallo! Ich habe gerade einen 30% Gutschein gewonnen und möchte ihn aktivieren.`;
      const whatsappUrl = `https://wa.me/4915164398197?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    });
  }
}
