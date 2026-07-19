import {
  Component,
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
  Subscription
} from 'rxjs';

import { AuthService } from '../services/auth';
import { Common } from '../services/common';
import { ApiService } from '../services/api';

import { Footer } from '../footer/footer';
import { Subheader } from '../subheader/subheader';
import { ItemCard } from '../item-card/item-card';

import { PopupService } from '../services/popup';

import { Time12Pipe } from '../directive/time12Pipe.directive';

import { Addressreminder } from '../addressreminder/addressreminder';

@Component({
  selector: 'app-storelist',

  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    Addressreminder,
    Subheader,
    Footer,
    Time12Pipe
  ],

  templateUrl: './storelist.html',

  styleUrl: './storelist.css',
})

export class Storelist
  implements OnInit, OnDestroy {

  // ===================================================
  // VARIABLES
  // ===================================================

  stores: any[] = [];

  filteredStores: any[] = [];

  storeTypes: string[] = [];

  selectedType: string = 'All';

  searchText: string = '';

  currentImageIndex: any = {};

  adminId = null;

  isLoading = false;

  allStoreDistance: any = {};

  distanceSubscription!: Subscription;

  // ===================================================
  // CONSTRUCTOR
  // ===================================================

  constructor(

    private auth: AuthService,

    public api: ApiService,

    public common: Common,

    private router: Router,

    private popup: PopupService

  ) {

    // scroll top

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });

  }
  addressSubscription!: Subscription;
  // ===================================================
  // INIT
  // ===================================================

  ngOnInit() {
    this.addressSubscription =

      this.common
        .selectedAddressUpdated$
        .subscribe((res: any) => {





          // IMPORTANT

          this.stores.forEach(store => {

            this.calculateStoreDistance(
              store
            );

          });



        });
    // distance subject subscribe

    this.distanceSubscription =

      this.common
        .storedistanceSubject
        .subscribe((res: any) => {

          this.allStoreDistance = res;
          // update all stores

          this.stores.forEach(store => {

            store.distanceData =
              this.getStoreDistance(store);

          });

          // refresh filtered list

          this.filteredStores = [
            ...this.stores
          ];

        });

    // get stores

    this.getStores();

  }

  // ===================================================
  // DESTROY
  // ===================================================

  ngOnDestroy() {

    // memory leak prevent

    if (this.distanceSubscription) {

      this.distanceSubscription.unsubscribe();

    }
    if (this.addressSubscription) {

      this.addressSubscription.unsubscribe();

    }
  }

  // ===================================================
  // LOGOUT
  // ===================================================
  searchFocused: boolean = false;

  async logout() {

    const confirmed =
      await this.common.confirmopen(
        "Are you sure you want to logout ?"
      );

    if (confirmed) {

      this.auth.logoutredirect();

    }

  }

  // ===================================================
  // GET STORES
  // ===================================================

  getStores() {

    this.isLoading = true;

    const adminId =
      this.auth.getAdminId();

    if (!adminId) {

      this.logout();

      return;

    }

    this.api
      .getStores(adminId)
      .subscribe(

        (res: any) => {

          this.isLoading = false;

          this.stores =
            res.data || [];

          // image index init
          // distance calculate

          this.stores.forEach(store => {

            this.currentImageIndex[
              store._id
            ] = 0;

            this.calculateStoreDistance(
              store
            );

          });

          // unique store types

          const types =
            this.stores.map(
              s => s.storeType
            );

          this.storeTypes =
            [...new Set(types)];

          // initial render

          this.filteredStores = [
            ...this.stores
          ];

        },

        (err: any) => {

          this.isLoading = false;

          this.common.alertmessage(
            'Failed to fetch store',
            'Error',
            'error'
          );

          console.error(
            'Error fetching stores:',
            err
          );

        }

      );

  }

  // ===================================================
  // CALCULATE DISTANCE
  // ===================================================

  calculateStoreDistance(
    store: any
  ) {

    const selectedaddress =
      this.common.selectedaddress;
    // address check

    if (

      !selectedaddress ||

      selectedaddress === '' ||

      (
        typeof selectedaddress ===
        'object' &&

        Object.keys(
          selectedaddress
        ).length === 0
      )

    ) {

      return;

    }

    const userLat =
      Number(selectedaddress.latitude);

    const userLng =
      Number(selectedaddress.longitude);

    // invalid lat lng

    if (

      !userLat ||
      !userLng ||

      !store.location.coordinates[0] ||
      !store.location.coordinates[1]

    ) {

      return;

    }

    this.common
      .calculateStoreDistance(

        store._id,

        Number(store.location.coordinates[1]),

        Number(store.location.coordinates[0]),

        userLat,

        userLng

      );

  }

  // ===================================================
  // GET DISTANCE
  // ===================================================

  getStoreDistance(
    store: any
  ) {

    const selectedaddress =
      this.common.selectedaddress;

    if (

      !selectedaddress ||

      selectedaddress === '' ||

      (
        typeof selectedaddress ===
        'object' &&

        Object.keys(
          selectedaddress
        ).length === 0
      )

    ) {

      return null;

    }

    const userLat =
      Number(selectedaddress.latitude);

    const userLng =
      Number(selectedaddress.longitude);

    const key =
      `${store._id}_${userLat}_${userLng}`;

    return this.allStoreDistance[key] || null;

  }

  // ===================================================
  // FILTER
  // ===================================================

  applyFilter() {

    this.filteredStores =
      this.stores.filter(store => {

        const matchType =

          this.selectedType === 'All' ||

          store.storeType ===
          this.selectedType;

        const matchSearch =

          store.storeName
            .toLowerCase()
            .includes(
              this.searchText
                .toLowerCase()
            );

        return (
          matchType &&
          matchSearch
        );

      });

  }

  // ===================================================
  // TYPE SELECT
  // ===================================================

  selectType(type: string) {

    this.selectedType = type;

    this.applyFilter();

  }

  // ===================================================
  // OPEN STORE
  // ===================================================

  openStore(store: any) {

    this.popup.open(
      'storedetails',
      store._id
    );

  }

  // ===================================================
  // NEXT IMAGE
  // ===================================================

  nextImage(
    store: any,
    event: Event
  ) {

    event.stopPropagation();

    const index =

      this.currentImageIndex[
      store._id
      ] || 0;

    this.currentImageIndex[
      store._id
    ] =

      (index + 1) %
      store.images.length;

  }

  // ===================================================
  // PREV IMAGE
  // ===================================================

  prevImage(
    store: any,
    event: Event
  ) {

    event.stopPropagation();

    const index =

      this.currentImageIndex[
      store._id
      ] || 0;

    this.currentImageIndex[
      store._id
    ] =

      (
        index - 1 +
        store.images.length
      ) %

      store.images.length;

  }

}