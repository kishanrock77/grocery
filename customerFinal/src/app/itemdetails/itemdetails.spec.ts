import {
  Component,
  Input,
  OnInit,
  OnDestroy
} from '@angular/core';
import {

  Subscription
} from 'rxjs';
import {
  CommonModule
} from '@angular/common';

import {
  ActivatedRoute,
  Router
} from '@angular/router';

import {
  HttpClient
} from '@angular/common/http';

import {
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';

import {
  Subject
} from 'rxjs';

import {
  takeUntil
} from 'rxjs/operators';

import { environment } from '../../environments/environment';

import { PopupService } from '../services/popup';
import { ApiService } from '../services/api';
import { AuthService } from '../services/auth';
import { Common } from '../services/common';
import { WishlistService } from '../services/wishlist';

import { ItemCard } from '../item-card/item-card';
import { Footer } from '../footer/footer';
import { Time12Pipe } from '../directive/time12Pipe.directive';
import { Addressreminder } from '../addressreminder/addressreminder';

@Component({

  selector: 'app-itemdetails',

  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ItemCard,
    Time12Pipe, Addressreminder,
    Footer
  ],

  templateUrl: './itemdetails.html',
  styleUrl: './itemdetails.css'

})

export class ItemDetails implements OnInit, OnDestroy {

  @Input() idfromSelectero = '';

  uri = environment.commonURL;
  baseUrl = this.uri + 'api';


  private destroy$ =
    new Subject<void>();

  itemId: any = '';

  loading = true;

  itemData: any;
  isCake: boolean = false;

  relatedItems: any[] = [];

  variantDetails: any[] = [];

  addonsDetails: any[] = [];

  currentImageIndex = 0;

  rating = 4.5;

  ratingCount = 1240;

  wishlist: string[] = [];

  qtyMap: any = {};
  distanceSubscription!: Subscription;

  addressSubscription!: Subscription;

  allStoreDistance: any = {};

  selectedAddress: any = null;
  constructor(

    private route: ActivatedRoute,

    private router: Router,

    private http: HttpClient,

    private auth: AuthService,

    private popup: PopupService,

    private api: ApiService,

    private common: Common,

    private wishlistService: WishlistService

  ) { }
  opencustomorder() {
    this.popup.open('customorder', -1);
  }
  // =====================================
  // INIT
  // =====================================

  ngOnInit(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
    this.syncCart();

    this.syncWishlist();
    // =====================================
    // SELECTED ADDRESS
    // =====================================

    this.selectedAddress =
      this.common.selectedaddress;

    // =====================================
    // INITIAL DISTANCE
    // =====================================

    this.calculateStoreDistance();

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

          if (
            !this.itemData ||
            !this.itemData?.storedetails
          ) {
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

            `${this.itemData.storedetails._id}_${userLat}_${userLng}`;

          this.itemData.distanceData =

            this.allStoreDistance[key]
            || null;

        });
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {

        this.loadPage(params['id']);

      });

  }

  ngOnDestroy(): void {

    this.destroy$.next();

    this.destroy$.complete();

    if (this.distanceSubscription) {

      this.distanceSubscription.unsubscribe();

    }

    if (this.addressSubscription) {

      this.addressSubscription.unsubscribe();

    }

  }

  // =====================================
  // LOAD PAGE
  // =====================================

  loadPage(idurl: any) {

    const adminId =
      this.auth.getAdminId();

    // URL
    if (idurl) {

      this.itemId = idurl;

      this.getItemDetails();

    }

    // POPUP INPUT
    else if (this.idfromSelectero) {

      if (!adminId) {

        this.auth.logoutredirect();

        return;

      }

      this.itemId =
        this.idfromSelectero;

      this.getItemDetails();

    }

    // NO ID
    else {

      this.router.navigate([
        '/productsoflvel2category'
      ]);

    }

  }

  scrolltooptionsorvariant() {
    const element = document.getElementById('idtorechscroll');
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }
  changemaitem(item: any) {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
    this.itemId = item._id;

    this.getItemDetails();

  }

  // =====================================
  // CART
  // =====================================
  getCart() {

    return this.common.getCart();

  }

  setCart(cart: any[]) {

    this.common.cartArr = cart;

    this.common.setCart(cart);

  }

  syncCart() {

    this.common.cartUpdated$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {

        this.syncCartState();

      });

    this.syncCartState();

  }

  syncCartState() {

    const cart = this.getCart();

    this.qtyMap = {};

    cart.forEach((x: any) => {

      const key =
        `${x.itemid}_${x.varientid}_${x.itemQuestionsindex}_${x.addonid || -1}`;

      if (!this.qtyMap[key]) {

        this.qtyMap[key] = 0;

      }

      this.qtyMap[key] +=
        x.totalquantity || 1;

    });

  }

  addToCart(
    variantId: any = -1,
    optionIndex: number = -1,
    addonId: any = -1
  ) {
    if (this.isCake) {
      if (!this.cakeMessage) {
        this.common.alertmessage("Enter message for cake", "warning", "warning");
        return
      }
    }

    let cart = this.getCart();

    // addon validation
    if (addonId != -1) {

      const mainIndex =
        cart.findIndex((x: any) =>

          x.itemid === this.itemData._id &&
          x.isitaddon == false

        );

      if (mainIndex == -1) {

        this.common.alertmessage(
          "Please first add main item",
          'warning',
          'warning'
        );

        return;

      }

    }

    cart.unshift({

      userId:
        this.auth.getSession()?.userId || 1,

      storeid:
        this.itemData.storedetails?._id || 0,
      message_on_cake_for_customorder: this.cakeMessage,
      itemid:
        this.itemData._id,

      itemimage:
        this.itemData.images?.[0],

      totalquantity: 1,

      isitaddon:
        addonId != -1,

      varientid:
        variantId,

      itemQuestionsindex:
        optionIndex,

      addonid:
        addonId

    });

    this.setCart(cart);

  }

  removeFromCart(
    variantId: any,
    optionIndex: number = -1,
    addonId: any = -1
  ) {

    let cart = this.getCart();

    const index =
      cart.findIndex((x: any) =>

        x.itemid === this.itemData._id &&
        x.varientid === variantId &&
        x.itemQuestionsindex === optionIndex &&
        (x.addonid || -1) === addonId

      );

    if (index > -1) {

      cart.splice(index, 1);

    }

    // remove all addons if main item removed
    const mainExist =
      cart.findIndex((x: any) =>

        x.itemid === this.itemData._id &&
        x.isitaddon == false

      );

    if (mainExist == -1) {

      cart = cart.filter((x: any) =>

        x.itemid != this.itemData._id

      );

    }

    this.setCart(cart);

  }

  // =====================================
  // ITEM DETAILS
  // =====================================
  goToSearch() {

    this.popup.open(
      'searchitem',
      'global'
    );

  }
  getItemDetails() {
    let bowseditemarr = localStorage.getItem('bowseditemarr');
    this.common.bowseditemarr = bowseditemarr ? JSON.parse(bowseditemarr) : [];
    this.common.bowseditemarr.push(this.itemId);
    localStorage.setItem(
      'bowseditemarr',
      JSON.stringify(this.common.bowseditemarr)
    );

    this.loading = true;

    this.http.get(

      this.baseUrl +
      '/item/customeritemdetail/' +
      this.itemId

    )

      .pipe(takeUntil(this.destroy$))

      .subscribe((res: any) => {

        this.itemData = res.data;
        this.isitacake();
        this.loading = false;

        this.fetchVariants();

        this.fetchAddons();

        this.getRelatedItems();
        this.calculateStoreDistance();
      });

  }
  // =====================================
  // CALCULATE DISTANCE
  // =====================================
  cakeMessage: string = '';

  characterCount: number = 0;


  countCharacters() {

    this.characterCount = this.cakeMessage.length;


  }



  isitacake() {
    // check if this.itemData.itemName contains substring 'cake' (case-insensitive)
    try {
      const name =
        this.itemData?.itemName || this.itemData?.name || '';

      this.isCake =
        typeof name === 'string' &&
        name.toLowerCase().includes('cake');
        this.cakeMessage =  this.itemData?.message_on_cake_for_customorder || '';
    } catch (e) {
      this.isCake = false;
    }
  }
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
        this.itemData?.storedetails
          ?.location.coordinates[1]
      );

    const storeLng =
      Number(
        this.itemData?.storedetails
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

        this.itemData.storedetails._id,

        storeLat,

        storeLng,

        userLat,

        userLng

      );

  }
  // =====================================
  // RELATED ITEMS
  // =====================================

  getRelatedItems() {

    const category =
      this.itemData.categories?.[0];

    if (!category) return;

    this.api.getLevel3CategoryItems({

      level2Id:
        category.level2,

      level3Id:
        category.level3,

      adminId:
        this.itemData.addedBy

    })

      .pipe(takeUntil(this.destroy$))

      .subscribe((res: any) => {

        this.relatedItems =
          (res.items || []).filter(
            (x: any) =>
              x._id !== this.itemData._id
          );

      });

  }

  // =====================================
  // VARIANTS
  // =====================================

  fetchVariants() {

    if (!this.itemData.variantItems?.length)
      return;

    this.http.post(

      this.baseUrl + '/item/multi-details',

      {
        ids:
          this.itemData.variantItems
      }

    )

      .pipe(takeUntil(this.destroy$))

      .subscribe((res: any) => {

        this.variantDetails =
          res.data || [];

      });

  }

  // =====================================
  // ADDONS
  // =====================================

  fetchAddons() {

    if (!this.itemData.addons?.length)
      return;

    this.http.post(

      this.baseUrl + '/item/multi-details',

      {
        ids:
          this.itemData.addons
      }

    )

      .pipe(takeUntil(this.destroy$))

      .subscribe((res: any) => {

        this.addonsDetails =
          res.data || [];

      });

  }

  // =====================================
  // IMAGE
  // =====================================

  goTo(i: number) {

    this.currentImageIndex = i;

  }

  // =====================================
  // WISHLIST
  // =====================================

  syncWishlist() {

    // initial
    this.loadWishlist();

    // realtime update
    this.wishlistService
      .wishlistUpdated$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {

        this.loadWishlist();

      });

  }

  loadWishlist() {

    const data =
      localStorage.getItem('wishlist');

    this.wishlist =
      data ? JSON.parse(data) : [];

  }

  isWishlisted(id: string) {

    return this.wishlist.includes(id);

  }

  toggleWishlist() {

    const index =
      this.wishlist.indexOf(
        this.itemData._id
      );

    if (index > -1) {

      this.wishlist.splice(index, 1);

    } else {

      this.wishlist.push(
        this.itemData._id
      );

    }

    localStorage.setItem(

      'wishlist',

      JSON.stringify(this.wishlist)

    );

    // 🔥 realtime update
    this.wishlistService
      .wishlistSubject
      .next(this.wishlist);

  }

  // =====================================
  // BUY NOW
  // =====================================

  buyNow() {

    this.addToCart();

    this.router.navigate(['/cart']);

  }

  // =====================================
  // NAVIGATION
  // =====================================

  openStore(_id: any) {

    this.popup.open(
      'storedetails',
      _id
    );

  }

  openCategoryItems() {

    this.popup.open(

      'productsoflvel2category',

      "l2_" +
      this.itemData.categories[0].level2

    );

  }

  openPage(url: string) {

    this.router.navigate([url]);

  }

  goBack() {

    if (
      this.common.browserorapp == 'browser'
    ) {

      window.history.back();

    } else {

      this.popup.close();

    }

  }

}