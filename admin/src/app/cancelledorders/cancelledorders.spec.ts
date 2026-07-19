import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Cancelledorders } from './cancelledorders';

describe('Cancelledorders', () => {
  let component: Cancelledorders;
  let fixture: ComponentFixture<Cancelledorders>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Cancelledorders]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Cancelledorders);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
