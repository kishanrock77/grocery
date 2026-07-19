import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StoreDashboard } from './store-dashboard';

describe('StoreDashboard', () => {
  let component: StoreDashboard;
  let fixture: ComponentFixture<StoreDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StoreDashboard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StoreDashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
