import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Customerorder } from './customerorder';

describe('Customerorder', () => {
  let component: Customerorder;
  let fixture: ComponentFixture<Customerorder>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Customerorder]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Customerorder);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
