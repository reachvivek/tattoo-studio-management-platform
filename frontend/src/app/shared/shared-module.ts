import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonComponent } from './components/button/button';
import { InputComponent } from './components/input/input';
import { FileUploadComponent } from './components/file-upload/file-upload';
import { FilterPipe } from './pipes/filter-pipe';

@NgModule({
  declarations: [
    ButtonComponent,
    InputComponent,
    FileUploadComponent,
    FilterPipe
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ],
  exports: [
    ButtonComponent,
    InputComponent,
    FileUploadComponent,
    FilterPipe,
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class SharedModule { }
