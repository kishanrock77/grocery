import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotificationPopup } from './notification-popup';

describe('NotificationPopup', () => {
  let component: NotificationPopup;
  let fixture: ComponentFixture<NotificationPopup>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationPopup]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NotificationPopup);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
