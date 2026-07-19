import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Itemcategory } from './itemcategory';

describe('Itemcategory', () => {
  let component: Itemcategory;
  let fixture: ComponentFixture<Itemcategory>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Itemcategory]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Itemcategory);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
