
import { Component, Input } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { AuthService } from '../services/auth';
import { Common } from '../services/common';
import { ApiService } from '../services/api';

import { WishlistService } from '../services/wishlist';

@Component({
  selector: 'app-selectarea',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './selectarea.html',
  styleUrl: './selectarea.css',
})
export class Selectarea {
  constructor(
    private wishlistService: WishlistService,
    private auth: AuthService, private api: ApiService,
    private common: Common, private route: ActivatedRoute,

    private router: Router
  ) {


    this.auth.isloggedIn() || this.router.navigate(['/login']);

    this.selectedArea = this.auth.getSession()?.selectedArea || '';
  }
  areas: any[] = [];
  selectedArea: any;
  comingfrom: any = '';
  @Input() comingfrominput: any = '';
  loading = false;
  ngOnInit() {


    console.log(localStorage.getItem('cart'), "cartttttttttttttttttt")
    console.log(localStorage.getItem('cartByArea'), "dddddddddddddddddddddddddd")



    this.route.params.subscribe(p => {

      if (p['comingfrom']) {

        this.comingfrom = p['comingfrom'];

      } else {
        this.comingfrom = this.comingfrominput;
      }
    }

    );
    this.getAreas();
  }

  getAreas() {
    this.loading = true;
    this.api.getAreas().subscribe((res: any) => {
      this.loading = false;
      if (res.success) {
        this.areas = res.areas;
      } else {
        this.common.alertmessage('Failed to load areas. Please try again later.', 'Error', 'error');

      }
    }, err => {
      this.loading = false;
      this.common.alertmessage('Failed to load areas. Please try again later.', 'Error', 'error');
    });
  }

  selectArea(area: any) {
    this.selectedArea = area;
  }
  async logout() {

  const confirmed =
    await this.common.confirmopen(
      "Are you sure you want to logout ?"
    );

  if (confirmed) {

    this.auth.logoutredirect();

  }

}
  resetselectedAddress() {
    localStorage.setItem(
      'selectedAddress',
      'null'
    );

    this.common.selectedaddress =
      null;

    this.common.selectedAddressUpdated.next(
      null
    );
  }

  universalfunctiontoassigncartwishbrowseinareakey() {
    const SelectedArea = JSON.parse(
      localStorage.getItem('selectedArea') || '{}'
    );
  }
  continue() {

    /* SAME AREA CHECK */

    const oldSelectedArea = JSON.parse(
      localStorage.getItem('selectedArea') || '{}'
    );

    if (oldSelectedArea?._id == this.selectedArea?._id) {

      if (this.comingfrom === 'address') {

        this.resetselectedAddress();

      }

      // this.router.navigate(['/home']);
      // return;
    }

    this.loading = true;

    this.api.selectareasubmit(
      this.selectedArea._id
    ).subscribe((res: any) => {

      this.loading = false;

      if (res.success) {

        this.resetselectedAddress();

        /* =========================
           CART
        ========================= */

        const oldCart = JSON.parse(
          localStorage.getItem('cart') || '[]'
        );

        const cartByArea = JSON.parse(
          localStorage.getItem('cartByArea') || '{}'
        );

        /* SAVE OLD AREA CART */

        if (oldSelectedArea?._id) {

          cartByArea[
            oldSelectedArea._id
          ] = oldCart;

        }

        /* FIRST TIME AREA DATA FIX */

        if (
          !cartByArea[this.selectedArea._id]
        ) {

          cartByArea[this.selectedArea._id] =
            oldCart;

        }

        localStorage.setItem(
          'cartByArea',
          JSON.stringify(cartByArea)
        );

        /* LOAD NEW AREA CART */

        const hasAreaCart =
          cartByArea.hasOwnProperty(
            this.selectedArea._id
          );

        if (hasAreaCart) {
          console.log("me here");
          const newCart =
            cartByArea[this.selectedArea._id];
          console.log("me here" + newCart);

          this.common.setCart(newCart);

        }

        /* =========================
           WISHLIST
        ========================= */

        const wishlist = JSON.parse(
          localStorage.getItem('wishlist') || '[]'
        );

        const wishlistByArea = JSON.parse(
          localStorage.getItem('wishlistByArea') || '{}'
        );

        /* SAVE OLD AREA WISHLIST */

        if (oldSelectedArea?._id) {

          wishlistByArea[
            oldSelectedArea._id
          ] = wishlist;

        }

        /* FIRST TIME FIX */

        if (
          !wishlistByArea[this.selectedArea._id]
        ) {

          wishlistByArea[
            this.selectedArea._id
          ] = wishlist;

        }

        localStorage.setItem(
          'wishlistByArea',
          JSON.stringify(wishlistByArea)
        );

        /* LOAD NEW AREA WISHLIST */

        const hasWishlist =
          wishlistByArea.hasOwnProperty(
            this.selectedArea._id
          );

        if (hasWishlist) {

          const newWishlist =
            wishlistByArea[
            this.selectedArea._id
            ];

          this.wishlistService.setWishlist(
            newWishlist
          );

        }

        /* =========================
           BROWSED ITEMS
        ========================= */

        const browsed = JSON.parse(
          localStorage.getItem('bowseditemarr') || '[]'
        );

        const browsedByArea = JSON.parse(
          localStorage.getItem('browsedByArea') || '{}'
        );

        /* SAVE OLD AREA BROWSED */

        if (oldSelectedArea?._id) {

          browsedByArea[
            oldSelectedArea._id
          ] = browsed;

        }

        /* FIRST TIME FIX */

        if (
          !browsedByArea[this.selectedArea._id]
        ) {

          browsedByArea[
            this.selectedArea._id
          ] = browsed;

        }

        localStorage.setItem(
          'browsedByArea',
          JSON.stringify(browsedByArea)
        );

        /* LOAD NEW AREA BROWSED */

        const hasBrowsed =
          browsedByArea.hasOwnProperty(
            this.selectedArea._id
          );

        if (hasBrowsed) {

          const newBrowsed =
            browsedByArea[
            this.selectedArea._id
            ];

          localStorage.setItem(
            'bowseditemarr',
            JSON.stringify(newBrowsed)
          );

        }

        /* =========================
           FINAL UPDATE
        ========================= */

        localStorage.setItem(
          'selectedArea',
          JSON.stringify(this.selectedArea)
        );

        localStorage.setItem(
          'adminId',
          res.adminId
        );

        this.common.storelist = [];
        this.common.categorylist = [];

        this.router.navigate(['/home']);

      } else {

        this.common.alertmessage(
          'Failed to select area. Please try again later.',
          'Error',
          'error'
        );

      }

    }, err => {

      this.loading = false;

      this.common.alertmessage(
        'Failed to select area. Please try again later.',
        'Error',
        'error'
      );

    });

  }
}