import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Itemlist } from './itemlist';

describe('Itemlist', () => {
  let component: Itemlist;
  let fixture: ComponentFixture<Itemlist>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Itemlist]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Itemlist);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
