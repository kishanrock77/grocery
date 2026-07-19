import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Viewcartbutton } from './viewcartbutton';

describe('Viewcartbutton', () => {
  let component: Viewcartbutton;
  let fixture: ComponentFixture<Viewcartbutton>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Viewcartbutton]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Viewcartbutton);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
