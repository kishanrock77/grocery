import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Storeowner } from './storeowner';

describe('Storeowner', () => {
  let component: Storeowner;
  let fixture: ComponentFixture<Storeowner>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Storeowner]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Storeowner);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
