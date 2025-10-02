import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonComponent } from './components/button/button';
import { InputComponent } from './components/input/input';
import { FileUploadComponent } from './components/file-upload/file-upload';

@NgModule({
  declarations: [
    ButtonComponent,
    InputComponent,
    FileUploadComponent
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
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class SharedModule { }
