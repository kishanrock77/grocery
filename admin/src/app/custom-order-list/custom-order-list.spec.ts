import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomOrderAdd } from './custom-order-add';

describe('CustomOrderAdd', () => {
  let component: CustomOrderAdd;
  let fixture: ComponentFixture<CustomOrderAdd>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomOrderAdd]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomOrderAdd);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
