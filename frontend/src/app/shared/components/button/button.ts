import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-button',
  standalone: false,
  templateUrl: './button.html',
  styleUrl: './button.scss'
})
export class ButtonComponent {
  @Input() type: 'button' | 'submit' = 'button';
  @Input() variant: 'primary' | 'secondary' = 'primary';
  @Input() disabled = false;
  @Input() loading = false;
  @Input() fullWidth = false;
  @Output() clicked = new EventEmitter<void>();

  onClick() {
    if (!this.disabled && !this.loading) {
      this.clicked.emit();
    }
  }

  getButtonClasses(): string {
    const base = 'rounded-xl font-bold text-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed';
    const width = this.fullWidth ? 'w-full' : '';
    const variants = {
      primary: '',
      secondary: 'bg-[#1A1A1A] text-white border border-[#333333] hover:bg-[#2A2A2A] shadow-black/50 px-8 py-4'
    };
    return `${base} ${width} ${variants[this.variant]}`;
  }
}
