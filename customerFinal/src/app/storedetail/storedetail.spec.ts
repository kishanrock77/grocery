
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { AuthService } from '../services/auth';
import { Common } from '../services/common';
import { ApiService } from '../services/api';
import { Footer } from '../footer/footer';
import { Subheader } from '../subheader/subheader';
import { ItemCard } from '../item-card/item-card';
import { Time12Pipe } from '../directive/time12Pipe.directive';
import { Addressreminder } from '../addressreminder/addressreminder';
import { Subscription } from 'rxjs';
@Component({
  selector: 'app-storedetail',

  templateUrl: './storedetail.html',
  styleUrl: './storedetail.css',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule, Time12Pipe, Addressreminder,
    Subheader,
    Footer,
    ItemCard
  ]
})
export class Storedetail implements OnDestroy{
  currentImageIndex = 0;
  showMenu = false;
  activeCat: any = null;
  @Input() idfromSelectero = '';
  next() {
    if (this.currentImageIndex < this.storedetails.images.length - 1) {
      this.currentImageIndex++;
    }
  }
distanceSubscription!: Subscription;

addressSubscription!: Subscription;

allStoreDistance: any = {};

selectedAddress: any = null;
  prev() {
    if (this.currentImageIndex > 0) {
      this.currentImageIndex--;
    }
  }

  toggleMenu() {
    this.showMenu = !this.showMenu;
  }

  scrollTo(id: string) {
    this.activeCat = id;
    this.showMenu = false;

    document.getElementById('cat-' + id)?.scrollIntoView({
      behavior: 'smooth'
    });
  }

ngOnDestroy(): void {

  if (this.distanceSubscription) {

    this.distanceSubscription.unsubscribe();

  }

  if (this.addressSubscription) {

    this.addressSubscription.unsubscribe();

  }

}

  adminId = null;


  constructor(
    private auth: AuthService,
    public api: ApiService,
    public common: Common,

    private router: Router,
    private route: ActivatedRoute
  ) {


    //scroll to top
    setTimeout(() => {
      document.querySelector('.popup')
        ?.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
    }, 0);
  }


  storeId: any;
  ngOnInit() {

    const adminId = this.auth.getAdminId();
    if (!adminId) {
      this.logout();
    }
// =====================================
// SELECTED ADDRESS
// =====================================

this.selectedAddress =
  this.common.selectedaddress;

// =====================================
// ADDRESS UPDATE
// =====================================

this.addressSubscription =

  this.common
    .selectedAddressUpdated$
    .subscribe((res: any) => {

      

        this.selectedAddress = res;

        this.calculateStoreDistance();

       

    });

// =====================================
// DISTANCE SUBJECT
// =====================================

this.distanceSubscription =

  this.common
    .storedistanceSubject
    .subscribe((res: any) => {

      this.allStoreDistance = res;

      if (!this.selectedAddress) {
        return;
      }

      if (!this.storedetails) {
        return;
      }

      const userLat =
        Number(
          this.selectedAddress.latitude
        );

      const userLng =
        Number(
          this.selectedAddress.longitude
        );

      const key =

        `${this.storedetails._id}_${userLat}_${userLng}`;

      this.storedetails.distanceData =

        this.allStoreDistance[key]
        || null;

    });
    this.route.params.subscribe(p => {

      if (p['id']) {

        this.storeId = p['id'];
        this.getStoresDetails();

      } else {
        if (this.idfromSelectero) {
          this.storeId = this.idfromSelectero;
          this.getStoresDetails();
        } else {
          this.router.navigate(['/storelist']);
        }


      }

    });

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
  isLoading = false;
  storedetails: any;
  groupedItems: any[] = [];

  getStoresDetails() {
    this.isLoading = true;

    this.api.getStoresDetails(this.storeId).subscribe((res: any) => {
      this.isLoading = false;

      if (res.success) {
        this.storedetails = res.data;
this.calculateStoreDistance();

        res.data.groupedItems.forEach((l2: any) => {

          l2.level3.forEach((cat: any) => {

            cat.items.forEach((item: any) => {

              item.storedetails = {

                _id:
                  this.storedetails._id,

                storeName:
                  this.storedetails.storeName,

                location:
                  this.storedetails.location,

                finalopenstatus:
                  this.storedetails.finalopenstatus

              };

            });

          });

        }); this.groupedItems = res.data.groupedItems;
      }

    }, (err: any) => {
      this.isLoading = false;
      this.common.alertmessage('Failed to fetch store', 'Error', 'error');
    });
  }
  getStoreColor(type: string) {
    const colors: any = {
      Grocery: '#4caf50',
      Restaurant: '#ff5722',
      Bakery: '#e91e63',
      Dairy: '#03a9f4'
    };

    return colors[type] || '#000';
  }
  openImage(img: string) {
    // window.open(img, '_blank');
  }
  getStoreIcon(type: string) {
    const icons: any = {
      Grocery: 'ri-shopping-basket-line',
      Instamart: 'ri-flashlight-line',
      Restaurant: 'ri-restaurant-line',
      'Fruit Shop': 'ri-apple-line',
      Hardware: 'ri-tools-line',
      Software: 'ri-code-s-slash-line',
      Bakery: 'ri-cake-3-line',
      Dairy: 'ri-cup-line',
      Other: 'ri-store-2-line'
    };

    return icons[type] || 'ri-store-2-line';
  }

  searchText = '';
  sortType = '';
  vegFilter = '';
  priceRange = '';

  filteredItems: any[] = [];
  isFilterMode = false;

  /* 🔥 debounce search */
  searchTimeout: any;

  onSearchChange() {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.applyFilter();
    }, 300);
  }

  applyFilter() {
    let allItems: any[] = [];

    // flatten
    this.groupedItems.forEach((l2: any) => {
      l2.level3.forEach((cat: any) => {

        allItems.push(...cat.items);
      });
    });

    // 🔍 SEARCH
    if (this.searchText) {
      const text = this.searchText.toLowerCase();
      allItems = allItems.filter(i =>
        i.itemName.toLowerCase().includes(text)
      );
    }

    // 🥦 VEG FILTER
    if (this.vegFilter) {
      allItems = allItems.filter(i => i.vegtype === this.vegFilter);
    }

    // 💰 PRICE RANGE
    if (this.priceRange) {
      const [min, max] = this.priceRange.split('-').map(Number);

      allItems = allItems.filter(i =>
        i.appPrice >= min && i.appPrice <= max
      );
    }

    // 🔽 SORT
    if (this.sortType === 'low') {
      allItems.sort((a, b) => a.appPrice - b.appPrice);
    }

    if (this.sortType === 'high') {
      allItems.sort((a, b) => b.appPrice - a.appPrice);
    }

    this.filteredItems = allItems;

    this.isFilterMode =
      !!this.searchText ||
      !!this.sortType ||
      !!this.vegFilter ||
      !!this.priceRange;
  }

  /* 🔥 CLEAR FUNCTIONS */
  clearSearch() {
    this.searchText = '';
    this.applyFilter();
  }

  clearSort() {
    this.sortType = '';
    this.applyFilter();
  }

  clearVeg() {
    this.vegFilter = '';
    this.applyFilter();
  }

  clearPrice() {
    this.priceRange = '';
    this.applyFilter();
  }

  resetFilters() {
    this.searchText = '';
    this.sortType = '';
    this.vegFilter = '';
    this.priceRange = '';
    this.applyFilter();
  }
  // =====================================
// CALCULATE DISTANCE
// =====================================

calculateStoreDistance() {

  const selectedaddress =
    this.selectedAddress;

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

  const storeLat =
    Number(
      this.storedetails
        ?.location.coordinates[1]
    );

  const storeLng =
    Number(
      this.storedetails
        ?.location.coordinates[0]
    );

  if (

    !userLat ||
    !userLng ||

    !storeLat ||
    !storeLng

  ) {

    return;

  }

  this.common
    .calculateStoreDistance(

      this.storedetails._id,

      storeLat,

      storeLng,

      userLat,

      userLng

    );

}
}