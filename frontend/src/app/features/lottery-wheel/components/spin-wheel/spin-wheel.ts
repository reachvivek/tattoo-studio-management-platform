import { Component, EventEmitter, Output } from '@angular/core';

interface WheelSegment {
  label: string;
  color: string;
  degree: number;
}

@Component({
  selector: 'app-spin-wheel',
  standalone: false,
  templateUrl: './spin-wheel.html',
  styleUrl: './spin-wheel.scss'
})
export class SpinWheelComponent {
  @Output() spinComplete = new EventEmitter<string>();

  isSpinning = false;
  hasSpun = false;
  finalRotation = 0;
  showConfetti = false;
  prizeText = '';

  // Wheel segments - 8 segments, one is 30% discount
  segments: WheelSegment[] = [
    { label: '30% RABATT', color: '#FF3D00', degree: 0 },
    { label: 'VERSUCHE NOCHMAL', color: '#1A1A1A', degree: 45 },
    { label: 'FAST!', color: '#2A2A2A', degree: 90 },
    { label: 'WEITER SO!', color: '#1A1A1A', degree: 135 },
    { label: 'NOCHMAL!', color: '#2A2A2A', degree: 180 },
    { label: 'VERSUCH ES!', color: '#1A1A1A', degree: 225 },
    { label: 'GLEICH!', color: '#2A2A2A', degree: 270 },
    { label: 'FAST DA!', color: '#1A1A1A', degree: 315 }
  ];

  spinWheel(): void {
    if (this.isSpinning || this.hasSpun) return;

    this.isSpinning = true;

    // Calculate rotation to land on 30% RABATT (segment 0)
    // Add multiple full rotations for effect (5-7 full spins)
    const fullRotations = 5 + Math.random() * 2; // 5-7 full rotations
    const targetSegment = 0; // 30% RABATT is at 0 degrees

    // Add small random offset to make it look natural (-10 to +10 degrees)
    const randomOffset = (Math.random() * 20) - 10;

    // Calculate final rotation (360 * full rotations + target position)
    this.finalRotation = (360 * fullRotations) + (360 - targetSegment) + randomOffset;

    // Spin animation will be handled by CSS
    setTimeout(() => {
      this.isSpinning = false;
      this.hasSpun = true;
      this.showPrize();
    }, 4000); // 4 second spin duration
  }

  showPrize(): void {
    this.prizeText = '30% RABATT!';
    this.showConfetti = true;

    // Hide confetti and emit complete event after celebration
    setTimeout(() => {
      this.showConfetti = false;
      setTimeout(() => {
        this.spinComplete.emit('30% discount');
      }, 500);
    }, 3000); // 3 seconds of celebration
  }

  getWheelRotation(): string {
    return `rotate(${this.finalRotation}deg)`;
  }
}
