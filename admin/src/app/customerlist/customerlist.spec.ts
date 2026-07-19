import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Customerlist } from './customerlist';

describe('Customerlist', () => {
  let component: Customerlist;
  let fixture: ComponentFixture<Customerlist>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Customerlist]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Customerlist);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
