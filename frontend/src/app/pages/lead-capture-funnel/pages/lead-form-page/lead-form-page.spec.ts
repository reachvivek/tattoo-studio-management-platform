import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeadFormPage } from './lead-form-page';

describe('LeadFormPage', () => {
  let component: LeadFormPage;
  let fixture: ComponentFixture<LeadFormPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LeadFormPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LeadFormPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
