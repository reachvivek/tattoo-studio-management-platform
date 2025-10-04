import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RealTimeCounter } from './real-time-counter';

describe('RealTimeCounter', () => {
  let component: RealTimeCounter;
  let fixture: ComponentFixture<RealTimeCounter>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RealTimeCounter]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RealTimeCounter);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
