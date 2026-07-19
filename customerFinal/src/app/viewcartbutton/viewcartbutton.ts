import {
  Component,
  HostListener,
  Input,
  OnInit,
  OnDestroy
} from '@angular/core';

import {
  Router,
  RouterModule
} from '@angular/router';

import {
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';

import {
  CommonModule
} from '@angular/common';

import {
  Subject
} from 'rxjs';

import {
  takeUntil
} from 'rxjs/operators';

import {
  AuthService
} from '../services/auth';

import {
  Common
} from '../services/common';

import {
  ApiService
} from '../services/api';
import { PopupService } from '../services/popup';

@Component({

  selector: 'app-viewcartbutton',

  standalone: true,

  imports: [

    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule

  ],

  templateUrl: './viewcartbutton.html',

  styleUrl: './viewcartbutton.css'

})

export class Viewcartbutton
  implements OnInit, OnDestroy {

  // =====================================
  // DESTROY
  // =====================================

  private destroy$ =
    new Subject<void>();

  // =====================================
  // INPUT
  // =====================================

  @Input()
  pagenow: any = '';

  // =====================================
  // VARIABLES
  // =====================================

  cart: any[] = [];

  cartCount = 0;

  bounce = false;

  showBar = false;

  bottomOffsetextra = 0;

  bottomOffset = 16;

  // =====================================
  // CONSTRUCTOR
  // =====================================

  constructor(

    private auth: AuthService,

    public api: ApiService,

    private common: Common,

    private popup: PopupService,
    private router: Router

  ) { }

  // =====================================
  // INIT
  // =====================================

  ngOnInit(): void {

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

        // detect add
        if (
          cart.length >
          this.cart.length
        ) {

          this.triggerBounce();

        }

        this.updateCartState(cart);

      });

    this.bottomOffset =
      this.bottomOffset +
      this.bottomOffsetextra;

  }

  // =====================================
  // DESTROY
  // =====================================

  ngOnDestroy(): void {

    this.destroy$.next();

    this.destroy$.complete();

  }

  // =====================================
  // UPDATE CART
  // =====================================

  updateCartState(cart: any[]) {

    // only main items
    const mainItems =
      cart.filter((x: any) =>

        x.isitaddon == false

      );

    this.cart = mainItems;

    this.cartCount =

      mainItems.reduce(

        (
          sum: number,
          x: any
        ) =>

          sum +
          (x.totalquantity || 0),

        0

      );

    this.showBar =
      this.cartCount > 0;
    this.common.countofcartitems = this.cartCount;

  }

  // =====================================
  // SCROLL
  // =====================================

  @HostListener('window:scroll')

  onScroll() {

    const footer =
      document.querySelector('footer');

    if (!footer) return;

    const rect =
      footer.getBoundingClientRect();

    const windowHeight =
      window.innerHeight;

    // footer visible
    if (rect.top < windowHeight) {

      const overlap =
        windowHeight - rect.top;

      this.bottomOffset =

        overlap +
        16 +
        this.bottomOffsetextra;

    }

    // normal
    else {

      this.bottomOffset =

        16 +
        this.bottomOffsetextra;

    }

  }

  // =====================================
  // ANIMATION
  // =====================================

  triggerBounce() {

    this.bounce = true;

    setTimeout(() => {

      this.bounce = false;

    }, 400);

  }

  // =====================================
  // NAVIGATION
  // =====================================

  goToCart() {
    this.popup.open(
      'cart',
      -1
    );


  }

}