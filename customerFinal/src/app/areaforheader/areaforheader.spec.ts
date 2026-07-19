import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Areaforheader } from './areaforheader';

describe('Areaforheader', () => {
  let component: Areaforheader;
  let fixture: ComponentFixture<Areaforheader>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Areaforheader]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Areaforheader);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
