import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminDashoard } from './admin-dashoard';

describe('AdminDashoard', () => {
  let component: AdminDashoard;
  let fixture: ComponentFixture<AdminDashoard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminDashoard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminDashoard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
