import {
  Component,
  OnInit
} from '@angular/core';
import { AfterViewInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
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

import { AuthService } from '../services/auth';
import { Common } from '../services/common';
import { ApiService } from '../services/api';


import { Footer } from '../footer/footer';
import { Header } from '../header/header';
import { ItemCard } from '../item-card/item-card';

import { PopupService } from '../services/popup';
import { Subject } from 'rxjs/internal/Subject';
import { takeUntil } from 'rxjs';
import { Addressreminder } from '../addressreminder/addressreminder';
import { Areaforheader } from '../areaforheader/areaforheader';
import { NotificationService } from '../services/notification.service';

@Component({

  selector: 'app-home',

  standalone: true,

  imports: [

    CommonModule,

    FormsModule,

    ReactiveFormsModule,

    RouterModule,

    Areaforheader,
    Footer,
    Addressreminder,
    ItemCard

  ],

  templateUrl: './home.html',

  styleUrl: './home.css',

})

export class Home implements OnInit, AfterViewInit, OnDestroy {

  showappupdatemessage = false;
  constructor(
    private notificationService:
      NotificationService,
    public auth: AuthService,

    public api: ApiService,

    public common: Common,

    private router: Router,

    private popup: PopupService

  ) {



    this.notificationService
      .requestPermission();
    //get current url  and break ith with ?
    //        `${this.baseUrl}?lat=${lat}&lng=${lng}&address=${encodeURIComponent(address)}`;
    // and get lat, lng and address from url and log it
    const urlParams = new URLSearchParams(window.location.search);
    const versionfromapp = urlParams.get('v');
    let angularversion = '1'
    const lat = urlParams.get('lat');
    const uniqueidofdevice = urlParams.get('uniqueidofdevice');



    const lng = urlParams.get('lng');
    const address = urlParams.get('address');
    console.log('Latitude:', lat);
    console.log('Longitude:', lng);
    console.log('Address:', address);
    if (versionfromapp) {
      if (angularversion != versionfromapp) {
        this.showappupdatemessage = true;
      }
    }


    localStorage.setItem('version_from_app', versionfromapp || '1');
    localStorage.setItem('lat_from_app', lat || '');
    localStorage.setItem('lng_from_app', lng || '');
    localStorage.setItem('address_from_app', address || '');
    if (uniqueidofdevice) {
      if (localStorage.getItem('uniqueidofdevice_from_app')) {
        if (localStorage.getItem('uniqueidofdevice_from_app') != uniqueidofdevice) {
          this.upadtedeviceuniqueid(uniqueidofdevice);
        }
      } else {
        this.upadtedeviceuniqueid(uniqueidofdevice);
      }
    }
    //localStorage.setItem('uniqueidofdevice_from_app', uniqueidofdevice || '');
    this.adminId = this.auth.getAdminId();

    this.username = this.auth.getSession()?.user.name || this.auth.logoutredirect();
  }
  @ViewChild('stickyWrapper') stickyWrapper!: ElementRef;
  private observer!: IntersectionObserver;
  upadtingtoken = false;
  upadtedeviceuniqueid(uniqueidofdevice: any) {
    this.upadtingtoken = true;
    this.auth.saveuniqueidofdevice(
      'customer',
      this.auth.getSession()?.userId,
      uniqueidofdevice
    ).subscribe({
     
      next: (res: any) => {
         this.upadtingtoken = false;
        console.log('Unique ID of device updated successfully');
        localStorage.setItem('uniqueidofdevice_from_app', uniqueidofdevice || '');
      },
      error: (err: any) => {
        this.upadtingtoken = false;
        console.log('Failed to update unique ID of device')
        // this.common.alertmessage(
        //   err.error.msg || 'Unique ID of device update failed',
        //   'Alert',
        //   'error'  
        // )  
      }
    });

  }
  ngAfterViewInit() {
    const sentinel = document.querySelector('#stickySentinel');
    const wrapper = this.stickyWrapper.nativeElement;

    if (sentinel) {
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          // Agar sentinel screen ke bahar ja chuka hai toh sticky class lagao
          if (!entry.isIntersecting) {
            wrapper.classList.add('is-sticky');
          } else {
            wrapper.classList.remove('is-sticky');
          }
        });
      }, {
        threshold: [0],
        // rootMargin: '-1px 0px 0px 0px' dene se 1px ka margin trigger upar milta hai 
        // jisse detection miss hone ke chances khatam ho jate hain.
        rootMargin: '-1px 0px 0px 0px'
      });

      this.observer.observe(sentinel);
    }
  }


  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
    this.destroy$.next();

    this.destroy$.complete();

  }
  // =====================================================
  // STATE
  // =====================================================
  username: any = null;
  selectedArea: any = null;

  adminId: any = '';

  categories: any[] = [];

  stores: any[] = [];

  level1: any[] = [];

  selectedLevel1: any = null;

  // 🔥 ITEMS MAP
  itemsMap: any = {};

  // =====================================================
  // LOADING
  // =====================================================

  loadingCategories = true;

  loadingStores = true;

  loadingItems: any = {};

  // =====================================================
  // INIT
  // =====================================================

  goToAccount() {
    this.router.navigate(['/accounts']);
  }

  private destroy$ =
    new Subject<void>();
  ngOnInitpart2(): void {

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

  // =====================================
  // DESTROY
  // =====================================



  // =====================================
  // UPDATE CART
  // =====================================

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

  ngOnInit(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
    // =========================================
    // AUTH CHECK
    // =========================================

    if (!this.auth.isloggedIn()) {

      this.router.navigate(['/login']);

      return;

    }

    // =========================================
    // SESSION
    // =========================================

    const session =
      this.auth.getSession();

    // =========================================
    // AREA CHECK
    // =========================================

    if (!session?.selectedArea) {

      this.router.navigate(['/select-area']);

      return;

    }

    this.selectedArea =
      session.selectedArea;

    // =========================================
    // LOAD
    // =========================================

    this.loadCategories();

    this.ngOnInitpart2();


  }
  goToCart() {
    this.popup.open(
      'cart',
      -1
    );


  }
  goToSearch() {

    this.popup.open(
      'searchitem',
      'global'
    );

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
  // =====================================================
  // LOAD CATEGORIES
  // =====================================================

  loadCategories(): void {

    // =========================================
    // CACHE
    // =========================================

    if (this.common.categorylist?.length) {

      this.categories =
        this.common.categorylist;

      this.level1 =
        this.categories.filter(
          (x: any) =>
            x.level_no === 1
        );

      this.loadingCategories = false;

      // 🔥 ADMIN
      this.adminId =
        localStorage.getItem('adminId') || '';

      // 🔥 LOAD NEXT
      this.loadStores();

      this.loadAllItems();

      return;

    }

    // =========================================
    // API
    // =========================================



    const adminId = this.auth.getAdminId();
    this.api.loadCategories(adminId).subscribe({

      next: (res: any) => {

        this.loadingCategories = false;

        this.categories =
          res || [];

        this.level1 =
          this.categories.filter(
            (x: any) =>
              x.level_no === 1
          );



        // 🔥 CACHE
        this.common.categorylist =
          this.categories;



        // 🔥 LOAD NEXT
        this.loadStores();

        this.loadAllItems();

      },

      error: () => {

        this.loadingCategories = false;

        this.common.alertmessage(

          'Failed to load categories',

          'Error',

          'error'

        );

      }

    });

  }

  // =====================================================
  // LOAD STORES
  // =====================================================

  loadStores(): void {

    // =========================================
    // CACHE
    // =========================================

    if (this.common.storelist?.length) {

      this.stores =
        this.common.storelist;

      this.loadingStores = false;

      return;

    }

    // =========================================
    // API
    // =========================================

    this.api.getHomeStores({

      adminId:
        this.adminId

    })

      .subscribe({

        next: (res: any) => {

          this.loadingStores = false;

          this.stores =
            res.stores || [];

          // 🔥 CACHE
          this.common.storelist =
            this.stores;

        },

        error: () => {

          this.loadingStores = false;

        }

      });

  }

  // =====================================================
  // LOAD ALL LEVEL1 ITEMS
  // =====================================================

  loadAllItems(): void {

    this.level1.forEach((cat: any) => {

      // =====================================
      // CACHE
      // =====================================

      if (
        this.common.itemArr &&
        this.common.itemArr[cat._id]
      ) {

        this.itemsMap[cat._id] =
          this.common.itemArr[cat._id];

        return;

      }

      // =====================================
      // LOADING
      // =====================================

      this.loadingItems[cat._id] = true;

      // =====================================
      // API
      // =====================================

      this.api.getLevel1Items({

        adminId:
          this.adminId,

        level1Id:
          cat._id

      })

        .subscribe({

          next: (res: any) => {

            this.loadingItems[cat._id] = false;

            this.itemsMap[cat._id] =
              res.items || [];

            // 🔥 CACHE
            if (!this.common.itemArr) {

              this.common.itemArr = {};

            }

            this.common.itemArr[cat._id] =
              res.items || [];

          },

          error: () => {

            this.loadingItems[cat._id] = false;

          }

        });

    });

  }

  // =====================================================
  // CATEGORY
  // =====================================================
  @ViewChild('contentStart')
  contentStart!: ElementRef;
  selectLevel1(cat: any): void {

    this.selectedLevel1 = cat;

    this.scrolltoc();

  }
  scrolltoc() {
    setTimeout(() => {

      const contentTop =
        this.contentStart
          .nativeElement
          .offsetTop;

      const stickyHeight =
        this.stickyWrapper
          .nativeElement
          .offsetHeight;

      window.scrollTo({

        top: contentTop - stickyHeight,

        behavior: 'smooth'
      });

    });
  }
  selectAll(): void {

    this.selectedLevel1 = null;

    this.scrolltoc();

  }

  // =====================================================
  // GET LEVEL1
  // =====================================================

  getLevel1() {

    return this.level1;

  }

  // =====================================================
  // GET LEVEL2
  // =====================================================

  getLevel2(parentId: string): any[] {

    const level2 =
      this.categories?.filter(
        (x: any) =>
          x.level_no === 2
      ) ?? [];

    if (!parentId)
      return level2;

    return level2.filter(
      (x: any) =>
        x.grandparent_id === parentId
    );

  }

  // =====================================================
  // ITEMS
  // =====================================================

  getItems(level1Id: string) {

    return this.itemsMap[level1Id] || [];

  }

  // =====================================================
  // STORE
  // =====================================================

  openStore(_id: any) {

    this.popup.open(
      'storedetails',
      _id
    );

  }

  // =====================================================
  // PRODUCTS
  // =====================================================

  goToProducts(
    prefixoflevel: any,
    cat: any
  ): void {

    this.popup.open(

      'productsoflvel2category',

      prefixoflevel + cat._id + "_" + cat.categoryName

    );

  }

  // =====================================================
  // STORE LIST
  // =====================================================

  gotostores(): void {

    this.router.navigate([
      '/storelist'
    ]);

  }

  // =====================================================
  // TRACKBY
  // =====================================================

  trackById(
    index: number,
    item: any
  ) {

    return item._id;

  }

}