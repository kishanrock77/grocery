import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Newwindow } from './newwindow';

describe('Newwindow', () => {
  let component: Newwindow;
  let fixture: ComponentFixture<Newwindow>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Newwindow]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Newwindow);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
