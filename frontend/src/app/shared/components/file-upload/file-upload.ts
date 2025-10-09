import { Component, Output, EventEmitter, Input } from '@angular/core';

@Component({
  selector: 'app-file-upload',
  standalone: false,
  templateUrl: './file-upload.html',
  styleUrl: './file-upload.scss'
})
export class FileUploadComponent {
  @Input() accept = 'image/*'; // Accept all image types
  @Input() maxFiles = 5;
  @Input() maxSize = 10485760; // 10MB
  @Output() filesSelected = new EventEmitter<File[]>();
  @Output() error = new EventEmitter<string>();

  selectedFiles: File[] = [];
  previews: string[] = [];
  showErrorModal = false;
  errorMessage = '';

  onFileSelect(event: any): void {
    const files: FileList = event.target.files;

    // Reset error state
    this.errorMessage = '';

    if (files.length > this.maxFiles) {
      this.showError(`Maximal ${this.maxFiles} Bilder erlaubt. Du hast ${files.length} ausgewählt.`);
      event.target.value = ''; // Reset input
      return;
    }

    const newFiles: File[] = [];
    const newPreviews: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Check file size (10MB limit)
      if (file.size > this.maxSize) {
        const sizeMB = (file.size / 1024 / 1024).toFixed(2);
        this.showError(`Bild "${file.name}" ist zu groß (${sizeMB} MB).\n\nMaximale Größe: 10 MB\n\nBitte komprimiere das Bild oder wähle ein kleineres aus.`);
        event.target.value = ''; // Reset input
        return;
      }

      // Check if it's an image
      if (!file.type.startsWith('image/')) {
        this.showError(`"${file.name}" ist kein Bild.\n\nBitte wähle nur Bilddateien aus (JPEG, PNG, HEIC, etc.).`);
        event.target.value = ''; // Reset input
        return;
      }

      newFiles.push(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        newPreviews.push(e.target.result);
        if (newPreviews.length === files.length) {
          this.previews = [...this.previews, ...newPreviews];
        }
      };
      reader.readAsDataURL(file);
    }

    this.selectedFiles = [...this.selectedFiles, ...newFiles];
    this.filesSelected.emit(this.selectedFiles);

    // Reset input to allow re-selecting same files
    event.target.value = '';
  }

  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1);
    this.previews.splice(index, 1);
    this.filesSelected.emit(this.selectedFiles);
  }

  private showError(message: string): void {
    this.errorMessage = message;
    this.showErrorModal = true;
    this.error.emit(message);
  }

  closeErrorModal(): void {
    this.showErrorModal = false;
    this.errorMessage = '';
  }
}
