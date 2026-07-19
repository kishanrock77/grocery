import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Storelist } from './storelist';

describe('Storelist', () => {
  let component: Storelist;
  let fixture: ComponentFixture<Storelist>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Storelist]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Storelist);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
