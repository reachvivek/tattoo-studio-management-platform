import { Component, Output, EventEmitter, Input } from '@angular/core';
import imageCompression from 'browser-image-compression';
import heic2any from 'heic2any';

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

    console.log('📁 Files selected:', files.length);

    if (!files || files.length === 0) {
      console.log('⚠️ No files selected');
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
        // Step 1: Convert HEIC to JPEG if needed (browser-image-compression CANNOT read HEIC)
        let processableFile = file;
        if (this.isHeicFile(file)) {
          console.log('🔄 Converting HEIC to JPEG:', file.name);
          processableFile = await this.convertHeicToJpeg(file);
          console.log('✅ HEIC converted to JPEG:', processableFile.name, 'Size:', (processableFile.size / 1024 / 1024).toFixed(2), 'MB');
        }

        // Step 2: Compress image to target size (1MB)
        const compressedFile = await this.compressImage(processableFile);
        const compressedSizeMB = (compressedFile.size / 1024 / 1024).toFixed(2);
        console.log('✅ Compressed:', compressedFile.name, 'Original:', fileSizeMB, 'MB → Compressed:', compressedSizeMB, 'MB');

        // Step 3: Verify compressed file is within limits (safety check)
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

      } catch (error: any) {
        console.error('❌ Error processing file:', error);
        this.isCompressing = false;
        const errorMsg = error?.message || 'Unbekannter Fehler';
        this.showError(`❌ Fehler beim Verarbeiten!\n\n"${file.name}" konnte nicht verarbeitet werden.\n\nFehler: ${errorMsg}\n\nBitte versuche es erneut oder wähle ein anderes Bild.`);
        event.target.value = '';
        return;
      }
    }

    this.selectedFiles = [...this.selectedFiles, ...newFiles];
    this.previews = [...this.previews, ...newPreviews];
    this.isCompressing = false;
    this.compressionProgress = 0;

    console.log('✅ All files processed successfully, total:', this.selectedFiles.length);
    this.filesSelected.emit(this.selectedFiles);

    // Reset input
    setTimeout(() => {
      if (event.target) {
        event.target.value = '';
      }
    }, 100);
  }

  /**
   * Check if file is HEIC/HEIF format
   * Safari/iOS don't always provide MIME type, so check both type and extension
   */
  private isHeicFile(file: File): boolean {
    const isHeicByType = file.type === 'image/heic' || file.type === 'image/heif';
    const isHeicByExtension = /\.(heic|heif)$/i.test(file.name);
    return isHeicByType || isHeicByExtension;
  }

  /**
   * Convert HEIC to JPEG using heic2any library
   * CRITICAL: browser-image-compression CANNOT read HEIC files!
   * This conversion MUST happen BEFORE compression
   */
  private async convertHeicToJpeg(file: File): Promise<File> {
    try {
      console.log('🔄 Starting HEIC conversion with heic2any...');

      // Convert HEIC to JPEG blob
      const convertedBlob = await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: 0.95 // High quality for conversion (will compress later)
      });

      // heic2any can return Blob or Blob[] - handle both cases
      const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;

      // Create new File from blob
      const newName = file.name.replace(/\.(heic|heif)$/i, '.jpg');
      const convertedFile = new File([blob], newName, {
        type: 'image/jpeg',
        lastModified: Date.now()
      });

      console.log('✅ HEIC conversion successful:', newName);
      return convertedFile;

    } catch (error: any) {
      console.error('❌ HEIC conversion failed:', error);
      throw new Error(`HEIC Konvertierung fehlgeschlagen: ${error.message || 'Unbekannter Fehler'}`);
    }
  }

  /**
   * Compress image using browser-image-compression
   * Reduces file size while maintaining quality
   * Target: 1MB max, 1920px dimension, 0.9 quality (near-lossless)
   *
   * NOTE: This library CANNOT read HEIC files!
   * HEIC must be converted to JPEG first using convertHeicToJpeg()
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
      console.log('🗜️ Compressing image with browser-image-compression...');
      const compressedFile = await imageCompression(file, options);

      // Rename file to have .jpg extension
      const newName = file.name.replace(/\.(png|gif|bmp|webp|avif|jpeg)$/i, '.jpg');

      const finalFile = new File([compressedFile], newName.endsWith('.jpg') ? newName : `${newName}.jpg`, {
        type: 'image/jpeg',
        lastModified: Date.now()
      });

      console.log('✅ Compression successful');
      return finalFile;

    } catch (error: any) {
      console.error('❌ Compression failed:', error);
      throw new Error(`Komprimierung fehlgeschlagen: ${error.message || 'Unbekannter Fehler'}`);
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
