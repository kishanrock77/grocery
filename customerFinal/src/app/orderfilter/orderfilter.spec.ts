import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Orderfilter } from './orderfilter';

describe('Orderfilter', () => {
  let component: Orderfilter;
  let fixture: ComponentFixture<Orderfilter>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Orderfilter]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Orderfilter);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
