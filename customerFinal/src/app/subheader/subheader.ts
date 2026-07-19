


import { Component, Input } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { AuthService } from '../services/auth';
import { Common } from '../services/common';
import { ApiService } from '../services/api';
import { PopupService } from '../services/popup';
import { environment } from '../../environments/environment';
import { Subject } from 'rxjs/internal/Subject';
import { takeUntil } from 'rxjs';
import { Areaforheader } from '../areaforheader/areaforheader';


@Component({
  selector: 'app-subheader',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, Areaforheader],
  templateUrl: './subheader.html',
  styleUrl: './subheader.css',
})
export class Subheader { 

  private destroy$ =
    new Subject<void>();
  constructor(
    public auth: AuthService, private api: ApiService, public popupService: PopupService,
    public common: Common,
    private router: Router
  ) {


    this.auth.isloggedIn() || this.router.navigate(['/login']);
    const session = this.auth.getSession();
    if (!session?.selectedArea) {
      this.router.navigate(['/select-area/subheader']);
    } else {
      this.selectedArea = session.selectedArea;
    }
  } selectedArea: any;
  @Input() showback: boolean = false;
  @Input() backurl: any = '';
  @Input() closeofpopupornormal: any = 'normal';
  ngonInit() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
    // initial load
    this.updateCartState(
      this.common.getCart()
    );

    // realtime updates
    this.common.cartUpdated$

      .pipe(
        takeUntil(this.destroy$)
      )

      .subscribe(cart => {



        this.updateCartState(cart);

      });

  }
  updateCartState(cart: any[]) {

    // only main items
    const mainItems =
      cart.filter((x: any) =>

        x.isitaddon == false

      );



    let cartCount =

      mainItems.reduce(

        (
          sum: number,
          x: any
        ) =>

          sum +
          (x.totalquantity || 0),

        0

      );
    this.common.countofcartitems = cartCount;

  }
  ngOnDestroy(): void {

    this.destroy$.next();

    this.destroy$.complete();

  }
  async logout() {

    const confirmed =
      await this.common.confirmopen(
        "Are you sure you want to logout ?"
      );

    if (confirmed) {
      this.popupService.stack = [];
      setTimeout(() => {

        this.auth.logoutredirect();

      }, 50);

    }

  }

  goToAccount() {


    this.popupService.stack = [];


    setTimeout(() => {

      this.router.navigate(['/accounts']);

    }, 50);
  }
  goToCart() {
    this.popupService.open(
      'cart',
      -1
    );


  }
  goBack() {

    if (this.closeofpopupornormal == 'normal' || this.common.browserorapp  == 'browser') {

      // if (this.backurl == '') {
      //   window.history.back();

      // } else {
      //   this.router.navigate([this.backurl]);
      // }
      window.history.back();
    } else {

      console.log(333)
      this.popupService.close();
    }


  }
}
