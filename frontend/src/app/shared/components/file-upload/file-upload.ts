import { Component, Output, EventEmitter, Input } from '@angular/core';

@Component({
  selector: 'app-file-upload',
  standalone: false,
  templateUrl: './file-upload.html',
  styleUrl: './file-upload.scss'
})
export class FileUploadComponent {
  @Input() accept = 'image/jpeg,image/png,image/webp';
  @Input() maxFiles = 5;
  @Input() maxSize = 10485760; // 10MB
  @Output() filesSelected = new EventEmitter<File[]>();
  @Output() error = new EventEmitter<string>();

  selectedFiles: File[] = [];
  previews: string[] = [];

  onFileSelect(event: any): void {
    const files: FileList = event.target.files;

    if (files.length > this.maxFiles) {
      this.error.emit(`Maximal ${this.maxFiles} Dateien erlaubt`);
      return;
    }

    this.selectedFiles = [];
    this.previews = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (file.size > this.maxSize) {
        this.error.emit(`Datei zu groß: ${file.name} (max 10MB)`);
        return;
      }

      this.selectedFiles.push(file);

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previews.push(e.target.result);
      };
      reader.readAsDataURL(file);
    }

    this.filesSelected.emit(this.selectedFiles);
  }

  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1);
    this.previews.splice(index, 1);
    this.filesSelected.emit(this.selectedFiles);
  }
}
