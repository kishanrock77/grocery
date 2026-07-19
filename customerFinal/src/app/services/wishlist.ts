import { Injectable } from '@angular/core';
import { Common } from './common';

import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class WishlistService {

  // =========================================
  // REALTIME WISHLIST STATE
  // =========================================

  private wishlistSubjectInternal =
    new BehaviorSubject<string[]>(
      this.loadWishlistFromStorage()
    );

  // observable
  wishlistUpdated$ =
    this.wishlistSubjectInternal.asObservable();

  // direct subject access
  wishlistSubject =
    this.wishlistSubjectInternal;

  constructor(
      private common: Common) { }

  // =========================================
  // LOCAL STORAGE
  // =========================================

  private loadWishlistFromStorage(): string[] {

    try {

      return JSON.parse(
        localStorage.getItem('wishlist') || '[]'
      );

    } catch {

      return [];

    }

  }

  setWishlist(wishlist: string[]) {

    localStorage.setItem(
      'wishlist',
      JSON.stringify(wishlist)
    );

    this.wishlistSubject.next([
      ...wishlist
    ]);

  }
  private updateWishlistState(
    wishlist: string[]
  ) {

    localStorage.setItem(
      'wishlist',
      JSON.stringify(wishlist)
    );

    // 🔥 realtime UI update everywhere
    this.wishlistSubjectInternal.next([
      ...wishlist
    ]);

  }

  // =========================================
  // GET
  // =========================================

  getWishlist(): string[] {

    return this.loadWishlistFromStorage();

  }

  // =========================================
  // CHECK
  // =========================================

  isWishlisted(id: string): boolean {

    return this
      .getWishlist()
      .includes(id);

  }

  // =========================================
  // ADD
  // =========================================

  add(id: string) {

    const wishlist =
      this.getWishlist();

    if (!wishlist.includes(id)) {

      wishlist.push(id);

      this.updateWishlistState(
        wishlist
      );

    }

  }

  // =========================================
  // REMOVE
  // =========================================

  remove(id: string) {

    const wishlist =
      this.getWishlist()
        .filter(x => x !== id);

    this.updateWishlistState(
      wishlist
    );

  }

  // =========================================
  // TOGGLE
  // =========================================

  toggleWishlist(id: string) {

    const wishlist =
      this.getWishlist();

    const exists =
      wishlist.includes(id);

    const updatedWishlist =
      exists
        ? wishlist.filter(x => x !== id)
        : [...wishlist, id];

    this.updateWishlistState(
      updatedWishlist
    );
    if (exists) {
      this.common.alertmessage('Removed from wishlist', 'info', 'info');
    } else {
      this.common.alertmessage('Added to wishlist', 'info', 'info');
    }

  }

  // =========================================
  // CLEAR
  // =========================================

  clearWishlist() {

    localStorage.removeItem(
      'wishlist'
    );

    this.wishlistSubjectInternal.next([]);

  }

}