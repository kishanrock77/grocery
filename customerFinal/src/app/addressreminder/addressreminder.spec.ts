import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../services/api';
import { AuthService } from '../services/auth';
import { Common } from '../services/common';
import { PopupService } from '../services/popup';
import { WishlistService } from '../services/wishlist';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-address-reminder-popup',
  imports: [CommonModule],
  templateUrl: './addressreminder.html',
  styleUrl: './addressreminder.css',
})
export class Addressreminder {

  constructor(

    public common: Common,

    private auth: AuthService,

    private api: ApiService,

    private http: HttpClient,

    public popupService: PopupService,

    private wishlistService: WishlistService,

    private fb: FormBuilder,

    private router: Router

  ) { }

  showPopup = false;

  popupInterval: any;

  ngOnInit() {

    this.startAddressReminder();

  }

  startAddressReminder() {

    /* FIRST POPUP AFTER 5 MIN */

    setTimeout(() => {

      this.checkAndShowPopup();

    }, 1 * 60 * 1000);

    /* THEN EVERY 5 MIN */

    this.popupInterval = setInterval(() => {

      this.checkAndShowPopup();

    }, 1 * 60 * 1000);

  }

  checkAndShowPopup() {

    const selectedaddress =
      this.common.selectedaddress;

    /* ADDRESS EXISTS */

    if (
      selectedaddress &&
      selectedaddress !== null &&
      selectedaddress !== '' &&
      !(
        typeof selectedaddress === 'object' &&
        Object.keys(selectedaddress).length === 0
      )
    ) {
      console.log('Address exists, no popup needed.');
      return;

    }

    /* LAST POPUP TIME */

    const lastPopupTime =
      Number(
        localStorage.getItem(
          'lastAddressPopupTime'
        ) || '0'
      );

    const now = Date.now();

    /* 5 MIN CHECK */

    const fiveMinutes =
      1 * 60 * 1000;

    if (
      now - lastPopupTime >= fiveMinutes
    ) {

      this.showPopup = true;

      localStorage.setItem(
        'lastAddressPopupTime',
        now.toString()
      );

    }

  }

  closePopup() {

    this.showPopup = false;

  }

  openAddressPopup() {

    this.showPopup = false;

    localStorage.setItem(
      'lastAddressPopupTime',
      Date.now().toString()
    );

    this.popupService.open(
      'addressaddselect',
      'popup'
    );

  }

  ngOnDestroy() {

    if (this.popupInterval) {

      clearInterval(this.popupInterval);

    }

  }

}