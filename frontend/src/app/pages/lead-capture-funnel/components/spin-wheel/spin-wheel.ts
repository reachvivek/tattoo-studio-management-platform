import { Component, EventEmitter, Output, ViewChild, ElementRef, AfterViewInit, OnDestroy, OnInit } from '@angular/core';
import { LeadCaptureStateService } from '../../services/lead-capture-state.service';
import { AnalyticsTracking } from '../../../../core/services/analytics-tracking';
import { MetaPixel } from '../../../../core/services/meta-pixel';

interface WheelSector {
  color: string;
  text: string;
  label: string;
}

@Component({
  selector: 'app-spin-wheel',
  standalone: false,
  templateUrl: './spin-wheel.html',
  styleUrl: './spin-wheel.scss'
})
export class SpinWheelComponent implements OnInit, AfterViewInit, OnDestroy {
  @Output() spinComplete = new EventEmitter<string>();

  constructor(
    private leadCaptureState: LeadCaptureStateService,
    private analyticsTracking: AnalyticsTracking,
    private metaPixel: MetaPixel
  ) {}
  @ViewChild('wheelCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private ctx!: CanvasRenderingContext2D;
  private dia = 500;
  private rad = this.dia / 2;
  private PI = Math.PI;
  private TAU = 2 * Math.PI;
  angVel = 0;  // Made public for template binding
  private ang = 0;
  private isSpinning = false;
  private spinAnimationId?: number;
  private textShuffleInterval?: any;

  hasSpun = false;
  showConfetti = false;
  prizeText = '';
  spinButtonText = 'DREHEN';

  // Wheel segments - 8 segments alternating 30% and Kostenloses Tattoo (30% always wins at index 0)
  // Using #10B981 (emerald-500) to match form button colors for better Safari compatibility
  sectors: WheelSector[] = [
    { color: '#10B981', text: '#FFFFFF', label: '30%' },
    { color: '#1A1A1A', text: '#FFFFFF', label: 'Kostenloses Tattoo' },
    { color: '#10B981', text: '#FFFFFF', label: 'Nochmals drehen' },
    { color: '#2A2A2A', text: '#FFFFFF', label: 'Kostenloses Tattoo' },
    { color: '#10B981', text: '#FFFFFF', label: '30%' },
    { color: '#1A1A1A', text: '#FFFFFF', label: 'Kostenloses Tattoo' },
    { color: '#10B981', text: '#FFFFFF', label: '30%' },
    { color: '#2A2A2A', text: '#FFFFFF', label: 'Kostenloses Tattoo' }
  ];

  private arc = this.TAU / this.sectors.length;

  ngOnInit(): void {
    // Track wheel page view
    this.analyticsTracking.trackWheelView();
    this.metaPixel.trackWheelPageView();
  }

  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    this.dia = canvas.width;
    this.rad = this.dia / 2;
    this.arc = this.TAU / this.sectors.length;

    this.sectors.forEach((sector, i) => this.drawSector(sector, i));
    this.rotate();
  }

  ngOnDestroy(): void {
    if (this.spinAnimationId) {
      cancelAnimationFrame(this.spinAnimationId);
    }
    if (this.textShuffleInterval) {
      clearInterval(this.textShuffleInterval);
    }
  }

  private drawSector(sector: WheelSector, i: number): void {
    const ang = this.arc * i;
    this.ctx.save();

    // Draw sector
    this.ctx.beginPath();
    this.ctx.fillStyle = sector.color;
    this.ctx.moveTo(this.rad, this.rad);
    this.ctx.arc(this.rad, this.rad, this.rad, ang, ang + this.arc);
    this.ctx.lineTo(this.rad, this.rad);
    this.ctx.fill();

    // Draw text with responsive font size
    this.ctx.translate(this.rad, this.rad);
    this.ctx.rotate(ang + this.arc / 2);
    this.ctx.textAlign = 'right';
    this.ctx.fillStyle = sector.text;

    // Use smaller font for longer text like "Nochmals drehen"
    const fontSize = sector.label.length > 5 ? 15 : 28;
    this.ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    this.ctx.fillText(sector.label, this.rad - 20, 10);

    this.ctx.restore();
  }

  private getIndex(): number {
    return Math.floor(this.sectors.length - (this.ang / this.TAU) * this.sectors.length) % this.sectors.length;
  }

  private rotate(): void {
    this.canvasRef.nativeElement.style.transform = `rotate(${this.ang - this.PI / 2}rad)`;
  }

  spinWheel(): void {
    if (this.isSpinning || this.hasSpun) return;

    this.isSpinning = true;
    this.angVel = 1; // Indicate spinning

    // Track wheel spin
    this.analyticsTracking.trackWheelSpin({ prize: '30%' });
    this.metaPixel.trackWheelSpin('30% discount');

    // Start text shuffling independently
    this.startTextShuffle();

    // Always target index 0 (30%)
    const targetIndex = 0;
    const segmentAngle = this.TAU / this.sectors.length;

    // The arrow points down at top center
    // Segment 0 is drawn from 0 to segmentAngle, center at segmentAngle/2
    // The rotate() applies: rotate(ang - PI/2)
    // For segment 0 center to point down (where arrow is), we need:
    // (segmentAngle/2 - PI/2) pointing down, which means ang should be PI/2 - segmentAngle/2
    const targetAngle = this.PI / 2 - (segmentAngle / 2);

    // Add 5-7 full rotations for visual effect
    const extraRotations = 5 + Math.floor(Math.random() * 3);

    // Total rotation should be from 0 to target
    const totalRotation = (extraRotations * this.TAU) + targetAngle;

    // Animation settings
    const duration = 4000; // 4 seconds
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Cubic ease-out for smooth deceleration
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      // Calculate current angle starting from 0, moving to totalRotation
      this.ang = totalRotation * easeProgress;
      this.rotate();

      if (progress < 1) {
        this.spinAnimationId = requestAnimationFrame(animate);
      } else {
        // Normalize angle after spin completes
        this.ang = targetAngle;
        this.rotate();
        this.angVel = 0;
        this.isSpinning = false;

        // Stop text shuffling and show final result
        this.stopTextShuffle();
        this.spinButtonText = '30%';

        // Wait a moment before showing prize (wheel has fully stopped)
        setTimeout(() => {
          const finalSector = this.sectors[targetIndex];
          this.onSpinEnd(finalSector);
        }, 300);
      }
    };

    animate();
  }

  private startTextShuffle(): void {
    const duration = 4000; // Match wheel animation duration
    const startTime = Date.now();
    let currentInterval = 100; // Start at 100ms

    const shuffle = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Slow down the shuffling as we approach the end (ease-out)
      currentInterval = 100 + (progress * 400); // From 100ms to 500ms

      if (progress < 1) {
        const randomIndex = Math.floor(Math.random() * this.sectors.length);
        this.spinButtonText = this.sectors[randomIndex].label;

        setTimeout(shuffle, currentInterval);
      } else {
        // Stop at 30%
        this.spinButtonText = '30%';
      }
    };

    shuffle();
  }

  private stopTextShuffle(): void {
    // No longer needed since shuffle stops itself
  }

  private onSpinEnd(sector: WheelSector): void {
    this.hasSpun = true;
    this.prizeText = sector.label === '30%' ? '30% RABATT!' : `${sector.label} RABATT!`;
    this.showConfetti = true;

    // Track prize claim
    this.analyticsTracking.trackPrizeClaim({ prize: '30%', discount: 30 });
    this.metaPixel.trackPrizeClaim('30% discount', 30);

    // Store discount in shared service
    this.leadCaptureState.setDiscount(30);

    setTimeout(() => {
      this.showConfetti = false;
      setTimeout(() => {
        this.spinComplete.emit('30% discount');
      }, 500);
    }, 3000);
  }
}
