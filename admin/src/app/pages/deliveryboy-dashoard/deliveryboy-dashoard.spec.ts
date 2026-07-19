import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeliveryboyDashoard } from './deliveryboy-dashoard';

describe('DeliveryboyDashoard', () => {
  let component: DeliveryboyDashoard;
  let fixture: ComponentFixture<DeliveryboyDashoard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeliveryboyDashoard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeliveryboyDashoard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
