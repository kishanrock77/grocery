import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  HostListener,
  OnChanges
} from '@angular/core';
// ======================================================
// IMPORT
// ======================================================

import {
  Subscription
} from 'rxjs';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Output, EventEmitter } from '@angular/core';

import { AuthService } from '../services/auth';
import { ApiService } from '../services/api';
import { Common } from '../services/common';
import { environment } from '../../environments/environment';
import { PopupService } from '../services/popup';
import { WishlistService } from '../services/wishlist';

@Component({
  selector: 'app-item-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './item-card.html',
  styleUrls: ['./item-card.css']
})
export class ItemCard implements OnInit, OnDestroy, OnChanges {

  uri: string = environment.commonURL;
  baseUrl = this.uri + "api";
  @Input() itemtotalforcart: any = null;
  @Input() itemtotalforcartforstore: any = null;


  
  @Input() item: any;
  @Input() storestatus: string = '';
  @Input() donotdoinsidecardonclick = false;
  @Input() fororderdetail = false;  
  @Input() userType = 'customer';
    @Input() forcefullyuserouting = 'false';

  @Output() movetowishlist = new EventEmitter<string>();
  // ======================================================
  // VARIABLES
  // ======================================================

  distanceSubscription!: Subscription;

  addressSubscription!: Subscription;

  allStoreDistance: any = {};
  sendMessage() {
    this.movetowishlist.emit(this.item);
  }
  priceRange: string = '';

  currentImageIndex = 0;
  autoSlideTimer: any;

  touchStartX = 0;
  touchEndX = 0;

  rating: number = 0;
  ratingCount: number = 0;
  stars: number[] = [];

  quantity: number = 0;
  showQty: boolean = false;

  qtyMap: any = {};

  wishlist: string[] = [];
  animateHeart = false;

  showPopup: any = null;
  popupType: any = '';

  variantDetails: any[] = [];
  selectedVariant: any = null;

  selectedOptionIndex: number = -1;
  selectedAddons: any[] = [];
  @Input() cartview = false;
  loadingVariants = false;

  addonsDetails: any = [];

  totalPopupQty = 0;

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private api: ApiService,
    private common: Common,
    private router: Router,
    private wishlistService: WishlistService,
    private popup: PopupService
  ) {

    console.log('item card')

    this.showpopuphandleforcartpage();
  }
  pendingtocallremovefromwishlistfuntion = false;
  removeFromWishlistIfExists() {

    console.log("i was here ", this.item._id);

    console.log(this.wishlist)

    if (this.showPopup == true) {
      this.pendingtocallremovefromwishlistfuntion = true;
      return;
    }

    const id = this.item._id;

    if (this.wishlist.includes(id)) {

      this.wishlistService.remove(id);

      this.wishlist =
        this.wishlistService.getWishlist();
      this.wishlistService
        .wishlistSubject
        .next(this.wishlist);
      this.common.alertmessage('Removed from wishlist and added to cart', 'info', 'info');

    }

  }
  openStore() {

    this.popup.open('storedetails', this.item.storedetails._id);
  }

  // ======================================================
  // INIT
  // ======================================================
  openoptionPopup() {
    console.log(this.popupType)
    this.popupType = 'options';
    console.log(this.popupType)

    this.showPopup = true;
    this.showpopuphandleforcartpage();

    document.body.classList.add(
      'popup-open'
    );

  }

  getAddonQty(addonId: string) {

    const cart = this.getCart();

    return cart.filter((x: any) =>

      x.itemid === this.item._id &&
      x.addonid === addonId

    ).length;

  }

  changeAddonQty(addon: any, change: number) {

    let cart = this.getCart();

    // 🔍 find addon item
    const index = cart.findIndex((x: any) =>

      x.itemid === this.item._id &&
      x.addonid === addon._id

    );

    // =========================
    // ADD
    // =========================

    if (change === 1) {

      cart.push({

        userId:
          this.auth.getSession()?.userId || 1,

        storeid:
          this.item.storeId || 0,

        itemid:
          this.item._id,

        itemimage:
          this.item.images?.[0],

        totalquantity: 1,

        isitaddon: true,

        addonid:
          addon._id,

        varientid: -1,

        itemQuestionsindex: -1

      });
      this.removeFromWishlistIfExists();
    }

    // =========================
    // REMOVE
    // =========================

    else {

      if (index > -1) {

        cart.splice(index, 1);

      }

    }

    this.setCart(cart);

    this.syncCart();

  }
  selectedAddress: any = null;
  cartSubscription: any;
  ngOnInit() {
console.log('item card 2')
    // ======================================================
    // SELECTED ADDRESS
    // ======================================================

    this.selectedAddress =
      this.common.selectedaddress;

    // ======================================================
    // INITIAL DISTANCE
    // ======================================================

    this.calculateStoreDistance();

    // ======================================================
    // ADDRESS UPDATE
    // ======================================================

    this.addressSubscription =

      this.common
        .selectedAddressUpdated$
        .subscribe((res: any) => {



          this.selectedAddress = res;

          // recalculate

          this.calculateStoreDistance();



        });

    // ======================================================
    // DISTANCE SUBJECT
    // ======================================================

    this.distanceSubscription =

      this.common
        .storedistanceSubject
        .subscribe((res: any) => {

          this.allStoreDistance = res;

          // address check

          if (!this.selectedAddress) {
            return;
          }

          // item check

          if (
            !this.item ||
            !this.item?.storedetails
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

            `${this.item.storedetails._id}_${userLat}_${userLng}`;

          // set distance

          this.item.distanceData =

            this.allStoreDistance[key]
            || null;


        });

    // ======================================================
    // INIT FUNCTIONS
    // ======================================================

    this.initRating();

    this.startAutoSlide();

    this.setPriceRange();

    this.syncCart();

    this.loadWishlist();

    // ======================================================
    // CART
    // ======================================================

    this.cartSubscription =

      this.common
        .cartUpdated$
        .subscribe(() => {

          this.syncCart2();

        });

    // ======================================================
    // WISHLIST
    // ======================================================

    this.wishlistService
      .wishlistSubject
      .subscribe((wishlist: any) => {

        this.wishlist =
          wishlist || [];

      });

    // ======================================================
    // STORE STATUS
    // ======================================================

    if (this.storestatus == '') {

      if (
        this.item?.storedetails
          ?.finalopenstatus
      ) {

        this.storestatus =

          this.item
            .storedetails
            .finalopenstatus;

      } else {

        this.storestatus =
          'Open';

      }

    }

    if (this.cartview == true) {

      this.storestatus = 'Open';

    }

  }

  ngOnChanges() {
    this.setPriceRange();
  }
  ngOnDestroy() {

    this.stopAutoSlide();

    if (this.cartSubscription) {

      this.cartSubscription.unsubscribe();

    }
    if (this.distanceSubscription) {

      this.distanceSubscription.unsubscribe();

    }

    if (this.addressSubscription) {

      this.addressSubscription.unsubscribe();

    }
  }

  // ======================================================
  // CALCULATE DISTANCE
  // ======================================================

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
        this.item?.storedetails.location.coordinates[1]
      );

    const storeLng =
      Number(
        this.item?.storedetails.location.coordinates[0]

      );

    if (

      !userLat ||
      !userLng ||

      !storeLat ||
      !storeLng

    ) {

      return;

    }

    let data = this.common
      .calculateStoreDistance(

        this.item.storedetails._id,

        storeLat,

        storeLng,

        userLat,

        userLng

      );

  }


  // ======================================================
  // GET DISTANCE
  // ======================================================



  // ======================================================
  // WISHLIST
  // ======================================================

  loadWishlist() {

    this.wishlist =
      this.wishlistService.getWishlist();

  }

  isWishlisted(id: string): boolean {

    return this.wishlist.includes(id);

  }

  toggleWishlist(event?: any) {

    if (event) {
      event.stopPropagation();
    }

    const id = this.item._id;

    this.wishlistService.toggleWishlist(id);

    this.wishlist =
      this.wishlistService.getWishlist();

    if (this.isWishlisted(id)) {

      this.triggerHeartAnimation();

    }

  }

  triggerHeartAnimation() {

    this.animateHeart = true;

    setTimeout(() => {

      this.animateHeart = false;

    }, 600);

  }

  // ======================================================
  // CLICK
  // ======================================================


  // ======================================================
  // RATING
  // ======================================================

  initRating() {

    this.rating =
      this.item.rating || Math.round((Math.random() * 1.5 + 3.5) * 10) / 10;

    this.ratingCount =
      this.item.ratingCount ||
      Math.floor(Math.random() * 4000 + 1000);

    this.stars =
      Array(Math.floor(this.rating)).fill(0);

  }

  // ======================================================
  // IMAGE
  // ======================================================

  startAutoSlide() {

    if (this.item?.images?.length > 1) {

      this.autoSlideTimer = setInterval(() => {

        this.nextImage();

      }, 2500);

    }

  }

  stopAutoSlide() {

    if (this.autoSlideTimer) {

      clearInterval(this.autoSlideTimer);

    }

  }

  restartAutoSlide() {

    this.stopAutoSlide();

    this.startAutoSlide();

  }

  nextImage() {

    this.currentImageIndex =
      (this.currentImageIndex + 1)
      % this.item.images.length;

  }

  prevImage() {

    this.currentImageIndex =
      (
        this.currentImageIndex - 1
        + this.item.images.length
      )
      % this.item.images.length;

  }

  goTo(index: number) {

    this.currentImageIndex = index;

    this.restartAutoSlide();

  }

  onImgError(event: any) {

    event.target.src = 'placeholder.png';

  }

  // ======================================================
  // TOUCH
  // ======================================================

  onTouchStart(event: TouchEvent) {

    this.touchStartX =
      event.touches[0].clientX;

    this.stopAutoSlide();

  }

  onTouchMove(event: TouchEvent) {

    this.touchEndX =
      event.touches[0].clientX;

  }

  onTouchEnd() {

    const diff =
      this.touchStartX - this.touchEndX;

    if (Math.abs(diff) > 50) {

      if (diff > 0) {

        this.nextImage();

      } else {

        this.prevImage();

      }

    }

    this.restartAutoSlide();

  }

  // ======================================================
  // PRICE
  // ======================================================

  setPriceRange() {

    if (this.item?.priceRange) {

      this.priceRange =
        this.item.priceRange;

      return;

    }

    if (
      !this.item?.variantItems
      || this.item.variantItems.length === 0
    ) {

      const price =
        this.item.appPrice
        || this.item.appPrice
        || 0;

      this.priceRange = `₹${price}`;

      return;

    }

    if (
      typeof this.item.variantItems[0]
      !== 'object'
    ) {

      const price =
        this.item.appPrice
        || this.item.appPrice
        || 0;

      this.priceRange = `₹${price}`;

      return;

    }

    const prices =
      this.item.variantItems.map((v: any) =>
        v.appPrice || v.appPrice || 0
      );

    const min = Math.min(...prices);
    const max = Math.max(...prices);

    this.priceRange =
      min === max
        ? `₹${min}`
        : `₹${min} - ₹${max}`;

  }

  // ======================================================
  // CART
  // ======================================================

  getCart() {

    return this.common.getCart();

  }
  setCart(cart: any[]) {
    console.log("st cart", cart)
    this.common.cartArr = cart;

    this.common.setCart(cart);

  }

  syncCart() {

    this.syncCart2();

  }

  showpopuphandleforcartpage() {

    let whtatosend;
    if (this.cartview == false) {
      whtatosend = false;
    } else {
      whtatosend = this.showPopup;

    }
    if (this.showPopup != null) {
      this.common.popofitemcondition.next(this.showPopup);
    }

  }

  syncCart2() {

    const cart = this.getCart();

    this.qtyMap = {};

    cart.forEach((x: any) => {

      const key =
        `${x.itemid}_${x.varientid}_${x.itemQuestionsindex}_${x.addonid || -1}`;

      if (!this.qtyMap[key]) {

        this.qtyMap[key] = 0;

      }

      this.qtyMap[key] += x.totalquantity;

    });

    const items =
      cart.filter((x: any) =>
        x.itemid === this.item._id
        && x.isitaddon == false
      );

    this.quantity =
      items.reduce(
        (sum: number, x: any) =>
          sum + x.totalquantity,
        0
      );

    this.showQty =
      this.quantity > 0;

  }

  // ======================================================
  // SIMPLE CART
  // ======================================================

  updateCart(change: number) {

    let cart = this.getCart();

    if (change === 1) {
      let tmpon = {

        userId:
          this.auth.getSession()?.userId || 1,

        storeid:
          this.item.storeId || 0,

        isitaddon: false,

        itemid:
          this.item._id,

        itemimage:
          this.item.images[0],

        totalquantity: 1,

        varientid: -1,

        itemQuestionsindex: -1

      };
      if (this.cartview) {
        cart.push({ ...tmpon });
      } else {
        cart.unshift({ ...tmpon });
      }
      this.removeFromWishlistIfExists();
    } else {

      const index =
        cart.findIndex((x: any) =>
          x.itemid === this.item._id
        );

      if (index > -1) {

        cart.splice(index, 1);

      }

    }

    this.setCart(cart);

  }

  removeItem() {

    let cart = this.getCart();

    cart =
      cart.filter((x: any) =>
        x.itemid !== this.item._id
      );

    this.setCart(cart);

    this.quantity = 0;

    this.showQty = false;

  }

  increase(popuptype: string = '') {
    if (popuptype == 'addon') {

      this.openAddonPopup();

      return;

    }
    const hasVariant =
      this.item.variantItems?.length > 0;

    const hasOptions =
      this.item.itemQuestions?.length > 0;

    if (hasVariant || hasOptions) {

      this.openVariantPopup();

      return;

    }

    this.quantity++;

    this.updateCart(1);

  }

  decrease(popuptype: string = '') {
    if (popuptype == 'addon') {

      this.openAddonPopup();

      return;
    }
    const hasVariant =
      this.item.variantItems?.length > 0;

    const hasOptions =
      this.item.itemQuestions?.length > 0;

    if (hasVariant || hasOptions) {

      this.openVariantPopup();

      return;

    }

    if (this.quantity <= 1) {

      this.removeItem();

      return;

    }

    this.quantity--;

    this.updateCart(-1);

  }

  addFirst() {

    if (this.storestatus === 'Closed') {
      return;
    }

    const hasVariant =
      this.item.variantItems?.length > 0;

    const hasOptions =
      this.item.itemQuestions?.length > 0;

    const hasAddons =
      this.item.addons?.length > 0;

    if (hasVariant || hasOptions) {

      this.openVariantPopup();

      return;

    }

    this.quantity = 1;

    this.showQty = true;

    this.updateCart(1);

    if (hasAddons) {

      this.openAddonPopup();

    }

  }

  // ======================================================
  // POPUPS
  // ======================================================

  openVariantPopup() {

    this.popupType = 'variant';

    this.showPopup = true;
    this.showpopuphandleforcartpage();

    this.loadingVariants = true;

    document.body.classList.add('popup-open');

    this.fetchVariantDetails();
    this.fetchAddDetails();

    this.setPriceRange();

  }

  openAddonPopup() {

    this.loadingVariants = true;

    this.fetchAddDetails();

    this.popupType = 'addon';

    this.showPopup = true;
    this.showpopuphandleforcartpage();

    this.selectedAddons = [];

  }

  closePopup() {

    this.showPopup = false;
    this.showpopuphandleforcartpage();

    document.body.classList.remove('popup-open');

    this.syncCart();
if(this.pendingtocallremovefromwishlistfuntion==true  ){
  this.removeFromWishlistIfExists();
  this.pendingtocallremovefromwishlistfuntion=false;

}
  }

  // ======================================================
  // API
  // ======================================================

  fetchVariantDetails() {

    this.loadingVariants = true;

    this.http.post(
      this.baseUrl + '/item/multi-details',
      {
        ids: this.item.variantItems
      }
    ).subscribe((res: any) => {

      this.variantDetails =
        res.data || [];

      if (this.variantDetails.length > 0) {

        this.selectVariant(
          this.variantDetails[0]
        );

      }

      this.loadingVariants = false;

    });

  }

  fetchAddDetails() {

    this.loadingVariants = true;

    this.http.post(
      this.baseUrl + '/item/multi-details',
      {
        ids: this.item.addons
      }
    ).subscribe((res: any) => {

      this.addonsDetails =
        res.data || [];

      this.loadingVariants = false;

    });

  }

  // ======================================================
  // SELECT
  // ======================================================

  selectVariant(v: any) {

    this.selectedVariant = v;

    this.selectedOptionIndex = -1;

    this.selectedAddons = [];

    this.syncVariantCart();

  }

  toggleAddon(addon: any) {

    const index =
      this.selectedAddons.findIndex(
        a => a._id === addon._id
      );

    if (index > -1) {

      this.selectedAddons.splice(index, 1);

    } else {

      this.selectedAddons.push(addon);

    }

  }

  syncVariantCart() {

    const cart = this.getCart();

    cart.filter(
      (x: any) =>
        x.itemid === this.item._id
        && x.varientid === this.selectedVariant?._id
        && x.isitaddon == false
    );

  }

  // ======================================================
  // POPUP CART
  // ======================================================

  getQty(
    variantId: any,
    optionIndex: number = -1,
    addonId: any = -1
  ) {

    const cart = this.getCart();

    return cart.filter((x: any) =>

      x.itemid === this.item._id &&
      x.varientid === variantId &&
      x.itemQuestionsindex === optionIndex &&
      (x.addonid || -1) === addonId

    ).length;

  }

  addToCart(
    variantId: any,
    optionIndex: number = -1,
    addonId: any = -1
  ) {

    let cart = this.getCart();
    if (this.cartview) {
      cart.push({

        userId:
          this.auth.getSession()?.userId || 1,

        storeid:
          this.item.storeId || 0,

        isitaddon: false,

        itemid:
          this.item._id,

        itemimage:
          this.item.images[0],

        totalquantity: 1,

        varientid: variantId,

        itemQuestionsindex: optionIndex,

        addonid: addonId

      });
    } else {
      cart.unshift({

        userId:
          this.auth.getSession()?.userId || 1,

        storeid:
          this.item.storeId || 0,

        isitaddon: false,

        itemid:
          this.item._id,

        itemimage:
          this.item.images[0],

        totalquantity: 1,

        varientid: variantId,

        itemQuestionsindex: optionIndex,

        addonid: addonId

      });
    }

    this.removeFromWishlistIfExists();
    this.setCart(cart);

    this.updatePopupQty();

    this.syncCart();

  }

  removeFromCart(
    variantId: any,
    optionIndex: number = -1,
    addonId: any = -1
  ) {

    let cart = this.getCart();

    const index =
      cart.findIndex((x: any) =>

        x.itemid === this.item._id &&
        x.varientid === variantId &&
        x.itemQuestionsindex === optionIndex &&
        (x.addonid || -1) === addonId

      );

    if (index > -1) {

      cart.splice(index, 1);

    }

    this.setCart(cart);

    this.updatePopupQty();

    this.syncCart();

  }

  updatePopupQty() {

    const cart = this.getCart();

    const items =
      cart.filter((x: any) =>
        x.itemid === this.item._id
      );

    this.totalPopupQty =
      items.length;

  }

  // ======================================================
  // OPEN DETAILS
  // ======================================================

  openitemdetails() {
    if(this.userType!=='customer'){
      return;
    }

    if (this.donotdoinsidecardonclick) {
      return;
    }

    if (this.forcefullyuserouting == 'true') {

      this.router.navigate([
        '/itemdetails',
        this.item._id
      ]);

    } else {

      this.popup.open(
        'itemdetails',
        this.item._id
      );

    }

  }

}