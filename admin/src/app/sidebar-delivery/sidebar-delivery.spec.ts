import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SidebarDelivery } from './sidebar-delivery';

describe('SidebarDelivery', () => {
  let component: SidebarDelivery;
  let fixture: ComponentFixture<SidebarDelivery>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarDelivery]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SidebarDelivery);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
