import {
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { Common } from '../services/common';

import { Router, RouterModule } from '@angular/router';

import { Footer } from '../footer/footer';

import { Subheader } from '../subheader/subheader';

import { ItemCard } from '../item-card/item-card';

import { AuthService } from '../services/auth';

import { ApiService } from '../services/api';

import { PopupService } from '../services/popup';

import { WishlistService } from '../services/wishlist';
import { Addressreminder } from '../addressreminder/addressreminder';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-whishitems',

  standalone: true,

  templateUrl: './whishitems.html',

  styleUrls: ['./whishitems.css'],

  imports: [
    CommonModule,
    RouterModule,Addressreminder,
    Footer,
    Subheader,
    ItemCard
  ]
})

export class Whishitems implements OnInit, OnDestroy {

  whishitems: any[] = [];

  loading = true;

  wishlistUpdatedSubscription?: Subscription;
  wishlistItemsSubscription?: Subscription;

  constructor(

    private auth: AuthService,
    private router: Router,

    private api: ApiService,
    private common: Common,

    public popupService: PopupService,

    private wishlistService: WishlistService

  ) { }
  gotohome() {
     
    this.router.navigate(['/home']);
  }
   ngOnDestroy(): void {
      this.wishlistUpdatedSubscription?.unsubscribe();
      this.wishlistItemsSubscription?.unsubscribe();
      this.common.amionwhishlist=false;
  }
  ngOnInit(): void {


    this.common.amionwhishlist=true;
window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
    this.getWishlistItems();

    // realtime update
    this.wishlistUpdatedSubscription?.unsubscribe();
    this.wishlistUpdatedSubscription = this.wishlistService
      .wishlistUpdated$
      .subscribe(() => {

        this.getWishlistItems();

      });

  }

  // ========================================
  // WISHLIST ITEMS
  // ========================================

  getWishlistItems() {

    this.loading = true;

    const wishlistIds =
      JSON.parse(

        localStorage.getItem(
          'wishlist'
        ) || '[]'

      );

    // empty
    if (!wishlistIds?.length) {

      this.whishitems = [];

      this.loading = false;

      return;

    }

    // API
    this.wishlistItemsSubscription?.unsubscribe();

    this.wishlistItemsSubscription = this.api.getWishlistItems(

      {

        itemIds: wishlistIds,

        adminId:
          this.auth.getAdminId()

      }

    ).subscribe({

      next: (res: any) => {

        this.whishitems =
          res?.items || [];

        this.loading = false;

      },

      error: () => {

        this.whishitems = [];

        this.loading = false;

      }

    });

  }

}