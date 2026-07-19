import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectStore } from './select-store';

describe('SelectStore', () => {
  let component: SelectStore;
  let fixture: ComponentFixture<SelectStore>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectStore]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SelectStore);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
