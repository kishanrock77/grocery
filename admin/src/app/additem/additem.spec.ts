import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Additem } from './additem';

describe('Additem', () => {
  let component: Additem;
  let fixture: ComponentFixture<Additem>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Additem]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Additem);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
