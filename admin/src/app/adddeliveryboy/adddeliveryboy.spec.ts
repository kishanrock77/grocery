import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Adddeliveryboy } from './adddeliveryboy';

describe('Adddeliveryboy', () => {
  let component: Adddeliveryboy;
  let fixture: ComponentFixture<Adddeliveryboy>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Adddeliveryboy]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Adddeliveryboy);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
