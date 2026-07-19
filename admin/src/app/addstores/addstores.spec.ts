import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Addstores } from './addstores';

describe('Addstores', () => {
  let component: Addstores;
  let fixture: ComponentFixture<Addstores>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Addstores]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Addstores);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
