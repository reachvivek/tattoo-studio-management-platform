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
    const base = 'px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0';
    const width = this.fullWidth ? 'w-full' : '';
    const variants = {
      primary: 'bg-gradient-to-r from-[#FF3D00] to-[#FF6E40] text-white hover:from-[#FF5722] hover:to-[#FF7043] shadow-[#FF3D00]/50',
      secondary: 'bg-[#1A1A1A] text-white border border-[#333333] hover:bg-[#2A2A2A] shadow-black/50'
    };
    return `${base} ${width} ${variants[this.variant]}`;
  }
}
