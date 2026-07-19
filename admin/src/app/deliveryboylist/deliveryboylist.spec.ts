import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Deliveryboylist } from './deliveryboylist';

describe('Deliveryboylist', () => {
  let component: Deliveryboylist;
  let fixture: ComponentFixture<Deliveryboylist>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Deliveryboylist]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Deliveryboylist);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
