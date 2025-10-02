import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormStepOne } from './form-step-one';

describe('FormStepOne', () => {
  let component: FormStepOne;
  let fixture: ComponentFixture<FormStepOne>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FormStepOne]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormStepOne);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
