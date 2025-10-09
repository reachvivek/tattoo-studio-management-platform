import { Component, Output, EventEmitter, Input } from '@angular/core';
import imageCompression from 'browser-image-compression';

@Component({
  selector: 'app-file-upload',
  standalone: false,
  templateUrl: './file-upload.html',
  styleUrl: './file-upload.scss'
})
export class FileUploadComponent {
  @Input() accept = 'image/*'; // Accept all image types
  @Input() maxFiles = 5;
  @Input() maxOriginalSize = 50 * 1024 * 1024; // 50MB - Max original file size (will compress to ~1MB)
  @Input() maxCompressedSize = 3 * 1024 * 1024; // 3MB - Max after compression (safety buffer)
  @Output() filesSelected = new EventEmitter<File[]>();
  @Output() error = new EventEmitter<string>();

  selectedFiles: File[] = [];
  previews: string[] = [];
  showErrorModal = false;
  errorMessage = '';
  isCompressing = false;
  compressionProgress = 0;

  async onFileSelect(event: any): Promise<void> {
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
      event.target.value = '';
      return;
    }

    this.isCompressing = true;
    const newFiles: File[] = [];
    const newPreviews: string[] = [];
    let processedFiles = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
      console.log('📁 Processing file:', file.name, 'Type:', file.type, 'Size:', fileSizeMB, 'MB');

      // Safari/iOS fix: Check file extension if MIME type is missing
      const isImageByExtension = /\.(jpg|jpeg|png|gif|webp|heic|heif|bmp|avif)$/i.test(file.name);
      const isImageByType = file.type && file.type.startsWith('image/');

      if (!isImageByType && !isImageByExtension) {
        this.isCompressing = false;
        this.showError(`❌ "${file.name}" ist kein gültiges Bild.\n\nBitte wähle Bilddateien aus (JPEG, PNG, HEIC, etc.).`);
        event.target.value = '';
        return;
      }

      // Check original file size BEFORE compression
      if (file.size > this.maxOriginalSize) {
        const maxSizeMB = (this.maxOriginalSize / 1024 / 1024).toFixed(0);
        this.isCompressing = false;
        this.showError(`❌ Datei zu groß!\n\n"${file.name}" (${fileSizeMB} MB) überschreitet die maximale Größe von ${maxSizeMB} MB.\n\nBitte wähle ein kleineres Bild.`);
        event.target.value = '';
        return;
      }

      try {
        // Compress and convert image to JPEG
        const compressedFile = await this.compressImage(file);
        const compressedSizeMB = (compressedFile.size / 1024 / 1024).toFixed(2);
        console.log('✅ Compressed:', compressedFile.name, 'Original:', fileSizeMB, 'MB → Compressed:', compressedSizeMB, 'MB');

        // Verify compressed file is within limits (safety check)
        if (compressedFile.size > this.maxCompressedSize) {
          const maxCompressedMB = (this.maxCompressedSize / 1024 / 1024).toFixed(0);
          this.isCompressing = false;
          this.showError(`❌ Komprimierung fehlgeschlagen!\n\n"${file.name}" ist nach Kompression immer noch zu groß (${compressedSizeMB} MB).\n\nMaximale Größe nach Kompression: ${maxCompressedMB} MB\n\nBitte wähle ein kleineres oder einfacheres Bild.`);
          event.target.value = '';
          return;
        }

        newFiles.push(compressedFile);

        // Create preview from compressed file
        const preview = await this.createPreview(compressedFile);
        newPreviews.push(preview);

        processedFiles++;
        this.compressionProgress = Math.round((processedFiles / files.length) * 100);
        console.log(`✅ Processed ${processedFiles}/${files.length} (${this.compressionProgress}%)`);

      } catch (error) {
        console.error('❌ Error processing file:', error);
        this.isCompressing = false;
        this.showError(`❌ Fehler beim Verarbeiten!\n\n"${file.name}" konnte nicht komprimiert werden.\n\nBitte versuche es erneut oder wähle ein anderes Bild.`);
        event.target.value = '';
        return;
      }
    }

    this.selectedFiles = [...this.selectedFiles, ...newFiles];
    this.previews = [...this.previews, ...newPreviews];
    this.isCompressing = false;
    this.compressionProgress = 0;

    console.log('All files processed, total:', this.selectedFiles.length);
    this.filesSelected.emit(this.selectedFiles);

    // Reset input
    setTimeout(() => {
      if (event.target) {
        event.target.value = '';
      }
    }, 100);
  }

  /**
   * Compress image using browser-image-compression
   * Converts HEIC/PNG to JPEG and reduces file size while maintaining quality
   * Target: 1MB max, 1920px dimension, 0.9 quality (near-lossless)
   */
  private async compressImage(file: File): Promise<File> {
    const options = {
      maxSizeMB: 1, // Target max 1MB (safe for all backends)
      maxWidthOrHeight: 1920, // Max dimension for high quality
      useWebWorker: true, // Use web worker for better performance
      fileType: 'image/jpeg', // Convert everything to JPEG (universal support)
      initialQuality: 0.9, // Very high quality (0.9 = near-lossless)
      alwaysKeepResolution: false, // Allow resize if needed to meet size target
    };

    try {
      const compressedFile = await imageCompression(file, options);

      // Rename file to have .jpg extension
      const newName = file.name.replace(/\.(heic|heif|png|gif|bmp|webp|avif)$/i, '.jpg');

      return new File([compressedFile], newName, {
        type: 'image/jpeg',
        lastModified: Date.now()
      });
    } catch (error) {
      console.error('Compression error:', error);
      // If compression fails, return original file
      return file;
    }
  }

  /**
   * Create preview from file
   */
  private createPreview(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e: any) => {
        resolve(e.target.result);
      };

      reader.onerror = (error) => {
        console.error('FileReader error:', error);
        // Return placeholder SVG
        resolve('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzMzMyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiNmZmYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5CaWxkPC90ZXh0Pjwvc3ZnPg==');
      };

      reader.readAsDataURL(file);
    });
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
