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

    console.log('Files selected:', files.length);

    if (!files || files.length === 0) {
      console.log('No files selected');
      return;
    }

    // Reset error state
    this.errorMessage = '';

    if (files.length > this.maxFiles) {
      this.showError(`Maximal ${this.maxFiles} Bilder erlaubt. Du hast ${files.length} ausgewählt.`);
      event.target.value = ''; // Reset input
      return;
    }

    const newFiles: File[] = [];
    const newPreviews: string[] = [];
    let loadedPreviews = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log('Processing file:', file.name, 'Type:', file.type, 'Size:', file.size);

      // Check file size (10MB limit)
      if (file.size > this.maxSize) {
        const sizeMB = (file.size / 1024 / 1024).toFixed(2);
        this.showError(`Bild "${file.name}" ist zu groß (${sizeMB} MB).\n\nMaximale Größe: 10 MB\n\nBitte komprimiere das Bild oder wähle ein kleineres aus.`);
        event.target.value = ''; // Reset input
        return;
      }

      // Safari/iOS fix: Check file extension if MIME type is missing
      const isImageByExtension = /\.(jpg|jpeg|png|gif|webp|heic|heif|bmp|avif)$/i.test(file.name);
      const isImageByType = file.type && file.type.startsWith('image/');

      if (!isImageByType && !isImageByExtension) {
        this.showError(`"${file.name}" ist kein gültiges Bild.\n\nBitte wähle Bilddateien aus (JPEG, PNG, HEIC, etc.).`);
        event.target.value = ''; // Reset input
        return;
      }

      newFiles.push(file);

      // Create preview - handle HEIC gracefully
      const reader = new FileReader();
      reader.onload = (e: any) => {
        newPreviews.push(e.target.result);
        loadedPreviews++;
        console.log(`Preview loaded ${loadedPreviews}/${files.length}`);

        if (loadedPreviews === files.length) {
          this.previews = [...this.previews, ...newPreviews];
          console.log('All previews loaded, total:', this.previews.length);
        }
      };
      reader.onerror = (error) => {
        console.error('FileReader error:', error);
        // Create placeholder for failed preview (e.g., HEIC on some browsers)
        newPreviews.push('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzMzMyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiNmZmYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5CaWxkPC90ZXh0Pjwvc3ZnPg==');
        loadedPreviews++;

        if (loadedPreviews === files.length) {
          this.previews = [...this.previews, ...newPreviews];
          console.log('All previews loaded (with placeholders), total:', this.previews.length);
        }
      };
      reader.readAsDataURL(file);
    }

    this.selectedFiles = [...this.selectedFiles, ...newFiles];
    console.log('Selected files updated, total:', this.selectedFiles.length);
    this.filesSelected.emit(this.selectedFiles);

    // Don't reset input immediately - causes issues on Safari
    setTimeout(() => {
      if (event.target) {
        event.target.value = '';
      }
    }, 100);
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
