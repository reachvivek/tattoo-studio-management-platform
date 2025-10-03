import { Component, EventEmitter, Output, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';

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
export class SpinWheelComponent implements AfterViewInit, OnDestroy {
  @Output() spinComplete = new EventEmitter<string>();
  @ViewChild('wheelCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private ctx!: CanvasRenderingContext2D;
  private dia = 500;
  private rad = this.dia / 2;
  private PI = Math.PI;
  private TAU = 2 * Math.PI;
  private friction = 0.991;
  angVel = 0;  // Made public for template binding
  private ang = 0;
  private spinButtonClicked = false;
  private animationId?: number;

  hasSpun = false;
  showConfetti = false;
  prizeText = '';
  spinButtonText = 'DREHEN';

  // Wheel segments - 8 segments alternating 30% and Kostenloses Tattoo (30% always wins at index 0)
  sectors: WheelSector[] = [
    { color: '#FF3D00', text: '#FFFFFF', label: '30%' },
    { color: '#1A1A1A', text: '#FFFFFF', label: 'Kostenloses Tattoo' },
    { color: '#FF6E40', text: '#FFFFFF', label: 'Nochmals drehen' },
    { color: '#2A2A2A', text: '#FFFFFF', label: 'Kostenloses Tattoo' },
    { color: '#FF5722', text: '#FFFFFF', label: '30%' },
    { color: '#1A1A1A', text: '#FFFFFF', label: 'Kostenloses Tattoo' },
    { color: '#FF4500', text: '#FFFFFF', label: '30%' },
    { color: '#2A2A2A', text: '#FFFFFF', label: 'Kostenloses Tattoo' }
  ];

  private arc = this.TAU / this.sectors.length;

  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    this.dia = canvas.width;
    this.rad = this.dia / 2;
    this.arc = this.TAU / this.sectors.length;

    this.sectors.forEach((sector, i) => this.drawSector(sector, i));
    this.rotate();
    this.engine();
  }

  ngOnDestroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
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
    const sector = this.sectors[this.getIndex()];
    this.canvasRef.nativeElement.style.transform = `rotate(${this.ang - this.PI / 2}rad)`;
    this.spinButtonText = !this.angVel ? 'DREHEN' : sector.label;
  }

  private frame(): void {
    if (!this.angVel && this.spinButtonClicked) {
      const finalSector = this.sectors[this.getIndex()];
      this.onSpinEnd(finalSector);
      this.spinButtonClicked = false;
      return;
    }

    this.angVel *= this.friction;
    if (this.angVel < 0.002) this.angVel = 0;
    this.ang += this.angVel;
    this.ang %= this.TAU;
    this.rotate();
  }

  private engine(): void {
    this.frame();
    this.animationId = requestAnimationFrame(() => this.engine());
  }

  spinWheel(): void {
    if (this.angVel || this.hasSpun) return;

    // Always target index 0 (30%)
    const targetIndex = 0;
    const segmentAngle = this.TAU / this.sectors.length;

    // Calculate exact angle to land on center of target segment
    const targetAngle = targetIndex * segmentAngle + (segmentAngle / 2);

    // Add 5-7 full rotations for effect
    const extraRotations = 5 + Math.floor(Math.random() * 3); // 5, 6, or 7 rotations
    const totalRotation = (extraRotations * this.TAU) + targetAngle;

    // Set target angle for precise landing
    this.ang = 0; // Reset current angle
    const finalAngle = totalRotation;

    // Animate with custom easing to land exactly on target
    const duration = 4000; // 4 seconds
    const startTime = Date.now();
    const startAngle = this.ang;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Cubic ease-out for smooth deceleration
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      this.ang = startAngle + (finalAngle * easeProgress);
      this.ang %= this.TAU;
      this.rotate();

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Ensure we land exactly on 30%
        this.ang = targetAngle % this.TAU;
        this.rotate();
        this.angVel = 0;
        this.spinButtonClicked = true;
      }
    };

    this.angVel = 1; // Set to non-zero to indicate spinning
    animate();
  }

  private onSpinEnd(sector: WheelSector): void {
    this.hasSpun = true;
    this.prizeText = sector.label === '30%' ? '30% RABATT!' : `${sector.label} RABATT!`;
    this.showConfetti = true;

    setTimeout(() => {
      this.showConfetti = false;
      setTimeout(() => {
        this.spinComplete.emit('30% discount');
      }, 500);
    }, 3000);
  }
}
