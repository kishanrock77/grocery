import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';

import { Subscription } from 'rxjs';

import { Common } from '../services/common';
import { AuthService } from '../services/auth';
import { ApiService } from '../services/api';
import { WishlistService } from '../services/wishlist';
import { PopupService } from '../services/popup';

import { ItemCard } from '../item-card/item-card';

@Component({
  selector: 'app-cartpage',
  standalone: true,
  templateUrl: './cartpage.html',
  styleUrls: ['./cartpage.css'],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ItemCard
  ]
})
export class Cartpage implements OnInit, OnDestroy {

  // =====================================================
  // VIEWCHILD
  // =====================================================
  amountfromwallet = 0;
  @ViewChild('couponInputWrapper')
  couponInputWrapper!: ElementRef;

  @ViewChild('couponSection')
  couponSection!: ElementRef;
  fullreadreturn = false;
  // =====================================================
  // COMMON
  // =====================================================

  loading = true;
  loadingcoupon = false;

  adminId: any;

  selectedAddress: any = null;

  paymentMethod = 'online';

  deliveryInstruction = '';

  // =====================================================
  // CART
  // =====================================================

  rawCart: any[] = [];

  wishlistItems: any[] = [];

  availableCoupons: any[] = [];

  selectedCoupon: any = null;

  couponCode = '';

  // =====================================================
  // STORE STRUCTURE
  // =====================================================

  storeSections: any[] = [];

  // =====================================================
  // TOTALS
  // =====================================================

  itemTotal = 0;

  couponDiscount = 0;

  deliveryCharge = 0;

  deliveryDiscount = 0;

  handlingCharge = 5;

  grandTotal = 0;

  totalSaving = 0;

  // =====================================================
  // FIRST ORDER
  // =====================================================

  customerOrderCount = 0;

  isFirst50Applied = false;

  first50Discount = 0;

  // =====================================================
  // UI
  // =====================================================

  setmeafetr2sectrue = false;

  // =====================================================
  // SUBSCRIPTIONS
  // =====================================================
  loadedcoupononce = false;
  cartSubscription?: Subscription;

  wishlistSubscription?: Subscription;

  itempopsubscription?: Subscription;
  // =====================================================
  // CONSTRUCTOR
  // =====================================================

  constructor(

    public common: Common,

    private auth: AuthService,

    private api: ApiService,

    private router: Router,

    private http: HttpClient,

    public popupService: PopupService,

    private wishlistService: WishlistService

  ) { }

  // =====================================================
  // INIT
  // =====================================================
  showpopofitemconditionrightnow = false;

  oldcart: any = [];
  walletbalanceAmount: any = 0;
  loadWallet() {
    const customerId =
      this.auth.getSession()?.userId;
    this.loading = true;

    this.http.post(
      this.api.baseUrl + '/wallet/wallet-history',
      {
        customerId: customerId
      }
    ).subscribe((res: any) => {

      this.loading = false;

      if (res.success) {

        this.walletbalanceAmount = res.balanceAmount || 0;

      }

    });

  }

  async ngOnInit() {

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
    this.loadWallet();
    this.adminId =
      this.auth.getAdminId();
    console.log("com ehere again ")
    this.rawCart =
      this.common.getCart() || [];

    await this.loadOrderCount();

    await this.loadCartData();

    this.getAreas();

    // =========================================
    // CART REALTIME
    // =========================================
    this.itempopsubscription = this.common.popofitemcondition$.subscribe(async (res: any) => {

      this.showpopofitemconditionrightnow = res;
      if (this.showpopofitemconditionrightnow == false) {
        await this.loadCartData();
      }

    });
    this.cartSubscription =

      this.common.cartUpdated$
        .subscribe(async () => {

          console.log("cthcing cart chnages")

          console.log("oldcart", this.oldcart)
          this.rawCart =
            this.common.getCart() || [];
          console.log("rawCart", this.rawCart)

          // ======================================
          // CART CHANGED ?
          // ======================================



          // old cart unique keys
          const oldKeys = new Set();

          this.oldcart.forEach((item: any) => {

            const key =
              `${item.storeid}_` +
              `${item.itemid}_` +
              `${item.varientid}_` +
              `${item.itemQuestionsindex}_` +
              `${item.isitaddon}`;

            oldKeys.add(key);

          });

          // extra items in new cart
          let extraidsinnewcart: any[] = [];

          this.rawCart.forEach((item: any) => {

            const key =
              `${item.storeid}_` +
              `${item.itemid}_` +
              `${item.varientid}_` +
              `${item.itemQuestionsindex}_` +
              `${item.isitaddon}`;

            // new item found
            if (!oldKeys.has(key)) {

              extraidsinnewcart.push({
                storeid: item.storeid,
                itemid: item.itemid,
                varientid: item.varientid,
                itemQuestionsindex: item.itemQuestionsindex,
                isitaddon: item.isitaddon
              });

            }

          });

          // API only if new unique item exists
          this.needtocallapi =
            extraidsinnewcart.length > 0;

          console.log(
            'extraidsinnewcart',
            extraidsinnewcart, this.needtocallapi, this.showpopofitemconditionrightnow
          );


          if (this.showpopofitemconditionrightnow != true) {
            await this.loadCartData();
          }


        });

    // =========================================
    // WISHLIST
    // =========================================

    this.wishlistSubscription =

      this.wishlistService
        .wishlistUpdated$
        .subscribe(() => {

          this.syncWishlistRealtime();

        });

    // =========================================
    // ADDRESS
    // =========================================

    this.common.selectedAddressUpdated$
      .subscribe((res: any) => {

        this.selectedAddress = res;


      });

  }




  // =====================================================
  // DESTROY
  // =====================================================

  ngOnDestroy(): void {

    this.cartSubscription?.unsubscribe();

    this.wishlistSubscription?.unsubscribe();

    this.itempopsubscription?.unsubscribe();

  }

  // =====================================================
  // HELPERS
  // =====================================================

  createCartKey(x: any) {

    return [

      x.storeid,

      x.itemid,

      x.varientid ?? -1,

      x.itemQuestionsindex ?? -1,

      x.addonid ?? -1,

      x.isitaddon ? 1 : 0

    ].join('_');

  }

  // =====================================================
  // LOAD CART DATA
  // =====================================================
  loadingspinner = false;
  loadcartres: any = {};
  needtocallapi = true;
  openStore(store: any) {
    this.popupService.open('storedetails', store.storeInfo._id);

  }

  async loadCartData() {

    try {

      const firstLoad =
        this.storeSections.length == 0;

      if (firstLoad) {

        this.loading = true;

      }

      this.loadingspinner = true;



      const cart =
        this.rawCart || [];
      // =====================================
      // EMPTY CART
      // =====================================

      if (!cart.length) {

        this.storeSections = [];

        this.calculateFinalTotals();

        return;

      }

      // =====================================
      // IDS
      // =====================================

      const mainItemIds = [

        ...new Set(

          cart
            .filter((x: any) => x?.itemid)
            .map((x: any) => x.itemid)

        )

      ];

      const variantIds = [

        ...new Set(

          cart
            .filter((x: any) =>

              x?.varientid &&
              x.varientid != -1

            )
            .map((x: any) => x.varientid)

        )

      ];

      const addonIds = [

        ...new Set(

          cart
            .filter((x: any) =>

              x?.addonid &&
              x.addonid != -1

            )
            .map((x: any) => x.addonid)

        )

      ];

      const storeIds = [

        ...new Set(

          cart
            .filter((x: any) => x?.storeid)
            .map((x: any) => x.storeid)

        )

      ];

      // =====================================
      // ALL ITEM IDS
      // =====================================

      const allItemIds = [

        ...new Set([

          ...mainItemIds,

          ...variantIds,

          ...addonIds

        ])

      ];

      // =====================================
      // API BODY
      // =====================================

      const body = {

        itemIds: allItemIds,

        storeIds,

        wishlistItemIds:
          this.wishlistService.getWishlist(),

        adminId:
          this.adminId

      };

      // =====================================
      // API
      // =====================================

      let res: any;
      console.log(this.needtocallapi, "needtocallapineedtocallapi")
      if (this.needtocallapi) {

        console.log(this.needtocallapi, "inside 1")

        res =
          await this.http.post(

            this.api.baseUrl +

            '/item/get-complete-cart-data',

            body

          ).toPromise();

        this.loadcartres =
          JSON.parse(JSON.stringify(res));

      } else {
        console.log(this.needtocallapi, "inside 2")

        res =
          JSON.parse(JSON.stringify(this.loadcartres));

      }

      // =====================================
      // MAPS
      // =====================================

      const itemMap = new Map();

      const storeMap = new Map();

      // ITEMS

      (res.items || [])
        .forEach((x: any) => {

          if (!x?._id) {
            return;
          }

          itemMap.set(
            x._id.toString(),
            x
          );

        });

      // STORES

      (res.stores || [])
        .forEach((x: any) => {

          if (!x?._id) {
            return;
          }

          storeMap.set(
            x._id.toString(),
            x
          );

        });

      // =====================================
      // RESET
      // =====================================

      this.storeSections = [];

      // =====================================
      // STORE LOOP
      // =====================================

      for (const storeId of storeIds) {

        const storeCart =

          cart.filter((x: any) =>

            x.storeid == storeId

          );

        const storeInfo =

          storeMap.get(
            storeId.toString()
          );

        const storeObj: any = {

          storeId,

          storeInfo,

          items: [],

          storeTotal: 0,
          storeTotaltoshowtostore: 0

        };

        // =================================
        // UNIQUE MAIN IDS
        // =================================

        const uniqueMainIds = [

          ...new Set(

            storeCart.map((x: any) =>
              x.itemid
            )

          )

        ];

        // =================================
        // ITEM LOOP
        // =================================

        for (const itemId of uniqueMainIds) {

          const itemRows =

            storeCart.filter((x: any) =>

              x.itemid == itemId

            );

          const mainInfo =

            itemMap.get(
              itemId.toString()
            );

          if (!mainInfo) {
            continue;
          }
          console.log("mainInfo", mainInfo)
          // =================================
          // MAIN ITEM PRICE
          // =================================

          const itemPrice =

            Number(

              mainInfo.appPrice

            );
          const itemPriceToshowtostore =

            Number(

              mainInfo.storePrice

            );
          // =================================
          // ITEM SECTION
          // =================================
          const cakeMessage =
            itemRows.find(
              (x: any) => x.message_on_cake_for_customorder !== undefined
            )?.message_on_cake_for_customorder || "";


          const itemSection: any = {

            itemId,

            itemInfo: {

              ...mainInfo,

              storedetails:
                storeInfo,
              message_on_cake_for_customorder:
                cakeMessage
            },

            mainQty: 0,

            mainPrice:
              itemPrice,
            mainPriceToshowtostore: itemPriceToshowtostore,

            mainTotal: 0,
            mainTotalToshowtostore: 0,

            extras: [],

            itemTotal: 0,
            itemTotaltoshowtostore: 0

          };

          // =================================
          // PURE MAIN
          // =================================

          const pureMain =

            itemRows.filter((x: any) =>

              (x.varientid ?? -1) == -1 &&

              (x.itemQuestionsindex ?? -1) == -1 &&

              (x.addonid ?? -1) == -1 &&

              x.isitaddon == false

            );

          itemSection.mainQty =
            pureMain.length;

          itemSection.mainTotal =

            itemSection.mainQty *

            itemSection.mainPrice;
          itemSection.mainTotalToshowtostore = itemSection.mainQty * itemSection.mainPriceToshowtostore;




          itemSection.itemTotal += itemSection.mainTotal;
          itemSection.itemTotaltoshowtostore += itemSection.mainTotalToshowtostore;
          // =================================
          // EXTRA ROWS
          // =================================

          const extraRows =

            itemRows.filter((x: any) =>

              !(

                (x.varientid ?? -1) == -1 &&

                (x.itemQuestionsindex ?? -1) == -1 &&

                (x.addonid ?? -1) == -1 &&

                x.isitaddon == false

              )

            );

          // =================================
          // GROUP EXTRAS
          // =================================

          const extraGroups: any = {};

          for (const row of extraRows) {

            const key = [

              row.varientid ?? -1,

              row.itemQuestionsindex ?? -1,

              row.addonid ?? -1,

              row.isitaddon ? 1 : 0

            ].join('_');

            if (!extraGroups[key]) {

              extraGroups[key] = [];

            }

            extraGroups[key].push(row);

          }

          // =================================
          // EXTRA LOOP
          // =================================

          Object.keys(extraGroups)
            .forEach((key: any) => {

              const rows =
                extraGroups[key];

              const first =
                rows[0];

              let title = '';

              let extratype = '';

              let price = 0;
              let appPrice = 0; let storePrice = 0;
              let image = '';

              let vegtype = 'na';

              // =========================
              // EXTRA TYPE
              // =========================

              if (

                first.varientid != -1 &&
                first.itemQuestionsindex == -1 &&
                first.addonid == -1

              ) {

                extratype = 'variant';

              }

              else if (

                first.varientid == -1 &&
                first.itemQuestionsindex != -1 &&
                first.addonid == -1

              ) {

                extratype = 'option';

              }

              else if (

                first.varientid != -1 &&
                first.itemQuestionsindex != -1 &&
                first.addonid == -1

              ) {

                extratype = 'variantoption';

              }

              else if (

                first.addonid != -1

              ) {

                extratype = 'addon';

              }

              else {

                extratype = 'extra';

              }

              // =========================
              // VARIANT
              // =========================

              let variant: any = null;

              if (
                first.varientid != -1
              ) {

                variant =

                  itemMap.get(

                    first.varientid
                      ?.toString()

                  );

                if (variant) {

                  title +=
                    variant.itemName;

                  image =

                    variant?.images?.[0] ||

                    '';

                  vegtype =

                    variant?.vegtype ||

                    'na';

                  // ONLY ADD VARIANT PRICE
                  // IF OPTION NOT SELECTED

                  if (
                    first.itemQuestionsindex == -1
                  ) {

                    price += Number(

                      variant.appPrice

                    );


                    appPrice += Number(

                      variant.appPrice

                    );

                    storePrice += Number(

                      variant.storePrice

                    );
                  }

                }

              }

              // =========================
              // OPTION
              // =========================

              if (
                first.itemQuestionsindex != -1
              ) {

                let option = null;

                // variant option

                if (
                  first.varientid != -1
                ) {

                  option =

                    variant
                      ?.itemQuestions?.[0]
                      ?.options?.[
                    first.itemQuestionsindex
                    ];

                }

                // main item option

                else {

                  option =

                    mainInfo
                      ?.itemQuestions?.[0]
                      ?.options?.[
                    first.itemQuestionsindex
                    ];

                }

                if (option) {

                  title +=

                    option.label;

                  // OPTION PRICE ONLY

                  price += Number(

                    option.appPrice

                  );

                  storePrice += Number(



                    option.storePrice

                  );


                  appPrice += Number(

                    option.appPrice



                  );

                }

              }

              // =========================
              // ADDON
              // =========================

              if (
                first.addonid != -1
              ) {

                const addon =

                  itemMap.get(

                    first.addonid
                      ?.toString()

                  );

                if (addon) {

                  title +=
                    ' Addon - ' +
                    addon.itemName;

                  // IMAGE

                  if (!image) {

                    image =

                      addon?.images?.[0] ||

                      '';

                  }

                  // VEGTYPE

                  if (
                    vegtype == 'na'
                  ) {

                    vegtype =

                      addon?.vegtype ||

                      'na';

                  }

                  // PRICE

                  price += Number(

                    addon.appPrice

                  );
                  appPrice += Number(

                    addon.appPrice

                  );


                  storePrice += Number(



                    addon.storePrice

                  );
                }

              }

              // =========================
              // FINAL EXTRA
              // =========================

              const qty =
                rows.length;

              const total =
                qty * price;
              const totalToshowtostore = qty * storePrice;

              itemSection.extras.push({

                title,

                extratype,

                qty,

                price, appPrice, storePrice,
                totalToshowtostore,
                total,

                image,

                vegtype,

                rows

              });

              itemSection.itemTotal +=
                total;
              itemSection.itemTotaltoshowtostore +=
                totalToshowtostore;
            });

          // =================================
          // STORE TOTAL
          // =================================
          console.log("itemSection", itemSection)
          storeObj.storeTotaltoshowtostore +=
            itemSection.itemTotaltoshowtostore;
          console.log("storeObj.storeTotaltoshowtostore", storeObj.storeTotaltoshowtostore)
          //problem.....inabouve line storeObj.storeTotaltoshowtostore is NaN
          storeObj.storeTotal +=
            itemSection.itemTotal;

          storeObj.items.push(
            itemSection
          );

        }
        console.log('storeObj', storeObj);
        this.storeSections.push(
          storeObj
        );

      }

      console.log(this.storeSections);

      // =====================================
      // EMPTY UI DELAY
      // =====================================

      setTimeout(() => {

        this.setmeafetr2sectrue = true;

      }, 1000);

      // =====================================
      // COUPONS
      // =====================================

      if (this.loadedcoupononce == false) {

        this.loadedcoupononce = true;
        await this.loadCoupons(
          storeIds
        );
      }
      // =====================================
      // TOTALS
      // =====================================

      this.calculateFinalTotals();

    }

    catch (e) {

      console.log(e);

    }

    finally {

      this.loading = false;

      this.loadingspinner = false;

    }

  }

  // =====================================================
  // ORDER COUNT
  // =====================================================

  async loadOrderCount() {

    try {

      const body = {

        userId:
          this.auth.getSession()?.userId,

        adminId:
          this.adminId

      };

      const res: any =

        await this.http.post(

          this.api.baseUrl +

          '/customer/order-count',

          body

        ).toPromise();

      this.customerOrderCount =
        res.totalOrders || 0;

    }

    catch (e) {

      console.log(e);

    }

  }
  singleDelievryBoyOrMultipleDelievryBoyForAllStores = 'Single';

  freedeleievrydisanceinkm = 5;

  deliveryChargePerKm = 3;

  // =====================================
  // SAFE NUMBER
  // =====================================

  safeNumber(val: any) {

    const num = Number(val);

    if (isNaN(num)) {
      return 0;
    }

    return num;

  }

  // =====================================
  // GET LAT LNG FROM GEOJSON
  // =====================================

  getLat(store: any) {

    return this.safeNumber(
      store?.location?.coordinates?.[1]
    );

  }

  getLng(store: any) {

    return this.safeNumber(
      store?.location?.coordinates?.[0]
    );

  }

  // =====================================
  // DEGREE TO RADIAN
  // =====================================

  deg2rad(deg: number) {

    return deg * (Math.PI / 180);

  }

  // =====================================
  // DISTANCE IN KM
  // =====================================

  getDistanceInKm(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) {

    // invalid coords

    if (
      !lat1 ||
      !lon1 ||
      !lat2 ||
      !lon2
    ) {
      return 0;
    }

    const R = 6371;

    const dLat =
      this.deg2rad(lat2 - lat1);

    const dLon =
      this.deg2rad(lon2 - lon1);

    const a =

      Math.sin(dLat / 2) *
      Math.sin(dLat / 2)

      +

      Math.cos(
        this.deg2rad(lat1)
      ) *

      Math.cos(
        this.deg2rad(lat2)
      ) *

      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

    const c =
      2 * Math.atan2(
        Math.sqrt(a),
        Math.sqrt(1 - a)
      );

    return R * c;

  }

  // =====================================
  // DELIVERY CHARGE
  // =====================================

  calculateDeliveryCharge() {

    try {

      let totalDistance = 0;

      // =====================================
      // NO ADDRESS / STORE
      // =====================================

      if (
        !this.selectedAddress ||
        !this.storeSections?.length
      ) {
        return 0;
      }

      // =====================================
      // SINGLE DELIVERY BOY
      // store -> store -> customer
      // =====================================

      if (
        this.singleDelievryBoyOrMultipleDelievryBoyForAllStores == 'Single'
      ) {

        // ---------------------------------
        // STORE TO STORE
        // ---------------------------------

        for (
          let i = 0;
          i < this.storeSections.length - 1;
          i++
        ) {

          const currentStore =
            this.storeSections[i]?.storeInfo;

          const nextStore =
            this.storeSections[i + 1]?.storeInfo;

          const distance =
            this.getDistanceInKm(

              this.getLat(currentStore),
              this.getLng(currentStore),

              this.getLat(nextStore),
              this.getLng(nextStore)

            );

          totalDistance += distance;

        }

        // ---------------------------------
        // LAST STORE -> CUSTOMER
        // ---------------------------------

        const lastStore =
          this.storeSections[
            this.storeSections.length - 1
          ]?.storeInfo;

        const customerDistance =
          this.getDistanceInKm(

            this.getLat(lastStore),
            this.getLng(lastStore),

            this.safeNumber(
              this.selectedAddress?.latitude
            ),

            this.safeNumber(
              this.selectedAddress?.longitude
            )

          );

        totalDistance += customerDistance;

      }

      // =====================================
      // MULTIPLE DELIVERY BOYS
      // every store -> customer
      // =====================================

      else {

        this.storeSections.forEach((store: any) => {

          const distance =
            this.getDistanceInKm(

              this.getLat(store?.storeInfo),
              this.getLng(store?.storeInfo),

              this.safeNumber(
                this.selectedAddress?.latitude
              ),

              this.safeNumber(
                this.selectedAddress?.longitude
              )

            );

          totalDistance += distance;

        });

      }

      // =====================================
      // FREE DISTANCE
      // =====================================

      let chargeableDistance =

        totalDistance -
        this.freedeleievrydisanceinkm;

      if (chargeableDistance < 0) {

        chargeableDistance = 0;

      }

      // =====================================
      // DELIVERY CHARGE
      // =====================================

      let charge =

        chargeableDistance *
        this.deliveryChargePerKm;

      // =====================================
      // PROFIT / COMMISSION
      // =====================================

      let totalAppPrice = 0;

      let totalStorePrice = 0;

      this.storeSections.forEach((store: any) => {

        store?.items?.forEach((item: any) => {

          // MAIN ITEM

          const mainQty =
            this.safeNumber(item?.mainQty);

          const appPrice =
            this.safeNumber(
              item?.itemInfo?.appPrice
            );

          const storePrice =
            this.safeNumber(
              item?.itemInfo?.storePrice
            );

          totalAppPrice +=
            mainQty * appPrice;

          totalStorePrice +=
            mainQty * storePrice;

          // EXTRAS

          (item?.extras || []).forEach((extra: any) => {

            const qty =
              this.safeNumber(extra?.qty);

            const extraappPrice =
              this.safeNumber(extra?.appPrice);
            const extrastorePrice =
              this.safeNumber(extra?.storePrice);
            totalAppPrice +=
              qty * extraappPrice;

            totalStorePrice +=
              qty * extrastorePrice;

          });

        });

      });

      // =====================================
      // DISCOUNT
      // =====================================

      const discount =

        this.safeNumber(
          this.couponDiscount
        )

        +

        this.safeNumber(
          this.first50Discount
        );

      // =====================================
      // PROFIT
      // =====================================

      this.profit =

        totalAppPrice

        - totalStorePrice

        - discount

        - charge

        + this.safeNumber(
          this.handlingCharge
        );

      // =====================================
      // FREE DELIVERY IF PROFIT > 200
      // =====================================

      if (this.profit > 200) {

        charge = 0;

      }

      console.log({
        totalAppPrice, totalStorePrice, discount,
        totalDistance,

        chargeableDistance,

        charge,

        profit: this.profit

      });

      return Math.ceil(charge);

    }

    catch (e) {

      console.log(e);

      return 0;

    }

  }
  profit = 0;


  // =====================================
  // DELIVERY CHARGE
  // =====================================


  // =====================================================
  // TOTALS
  // =====================================================
  itemTotaltoshowtostore = 0;
  calculateFinalTotals() {
    if (this.singleDelievryBoyOrMultipleDelievryBoyForAllStores !== 'Single') {
      if (this.storeSections.length > 1) {
        this.paymentMethod = 'online';
      }
    }
    this.itemTotal = 0;
    this.itemTotaltoshowtostore = 0;

    this.storeSections
      .forEach((store: any) => {

        this.itemTotal +=
          Number(store.storeTotal || 0);
        this.itemTotaltoshowtostore +=
          Number(store.storeTotaltoshowtostore || 0);

      });

    // =========================================
    // FIRST50
    // =========================================

    this.isFirst50Applied = false;

    this.first50Discount = 0;

    if (

      this.customerOrderCount == 0 &&

      this.itemTotal >= 199

    ) {

      this.isFirst50Applied = true;

      this.first50Discount = 50;

      this.selectedCoupon = null;

      this.couponDiscount = 0;

    }


    // =========================================
    // COUPON
    // =========================================

    this.couponDiscount = 0;

    if (

      this.selectedCoupon &&

      !this.isFirst50Applied

    ) {

      if (

        this.selectedCoupon.discountType == 'flat'

      ) {

        this.couponDiscount =

          Number(
            this.selectedCoupon.discountValue || 0
          );

      }

      else {

        this.couponDiscount =

          (

            this.itemTotal *

            Number(
              this.selectedCoupon.discountValue || 0
            )

          ) / 100;

      }

    }

    // =========================================
    // DELIVERY
    // =========================================

    this.deliveryCharge =
      this.calculateDeliveryCharge();

    this.deliveryDiscount = 0;

    // =====================================
    // FIRST 10 ORDERS FREE DELIVERY
    // BUT MINIMUM ₹10 PROFIT MUST STAY
    // =====================================

    if (
      this.customerOrderCount < 10
    ) {

      // full free delivery by default

      this.deliveryDiscount =
        this.deliveryCharge;

      // ---------------------------------
      // if profit goes below 10
      // reduce discount
      // ---------------------------------

      if (this.profit < 10) {

        // keep minimum ₹10 profit

        const maxDiscountPossible =

          this.deliveryCharge -

          (10 - this.profit);

        // never negative

        this.deliveryDiscount = parseInt(
          Math.max(
            0,
            maxDiscountPossible
          ).toString()
        );

      }

      // ---------------------------------
      // if delivery charge becomes 0
      // and still profit < 10
      // then force ₹10 delivery charge
      // ---------------------------------

      if (
        this.deliveryCharge == 0 &&
        this.profit < 10
      ) {

        this.deliveryCharge = 10;

        this.deliveryDiscount = 0;

      }

    }


    console.log(this.profit + this.deliveryCharge - this.deliveryDiscount, "profit after delivery charge and discount")
    // =========================================
    // GRAND TOTAL
    // =========================================

    this.grandTotal =

      this.itemTotal

      - this.couponDiscount

      - this.first50Discount

      + this.deliveryCharge

      - this.deliveryDiscount

      + this.handlingCharge;
    this.grandTotalBeforewllet = this.grandTotal;
    if (this.walletbalanceAmount > 0) {
      if (this.walletbalanceAmount >= this.grandTotal) {
        this.amountfromwallet = this.grandTotal;
        this.paymentMethod = 'online';

      } else {
        this.amountfromwallet = this.walletbalanceAmount;
      }
      this.grandTotal = this.grandTotal - this.amountfromwallet;
    }
    // =========================================
    // SAVING
    // =========================================

    this.totalSaving =

      this.couponDiscount +

      this.deliveryDiscount +

      this.first50Discount;

  }
  grandTotalBeforewllet = 0;
  // =====================================================
  // COUPONS
  // =====================================================

  async loadCoupons(storeIds: any[]) {

    try {

      const body = {

        adminId:
          this.adminId,

        customerId:
          this.auth.getSession()?.userId,

        storeIds

      };

      const res: any =

        await this.http.post(

          this.api.baseUrl +

          '/customer/get-checkout-coupons',

          body

        ).toPromise();

      this.availableCoupons =
        res.coupons || [];

    }

    catch (e) {

      console.log(e);

    }

  }

  // =====================================================
  // APPLY COUPON
  // =====================================================

  applyCoupon(coupon: any) {

    if (this.isFirst50Applied) {

      this.common.alertmessage(

        'FIRST50 already applied',

        'warning',

        'warning'

      );

      return;

    }

    this.selectedCoupon = coupon;

    this.calculateFinalTotals();

  }

  // =====================================================
  // APPLY COUPON CODE
  // =====================================================

  async applyCouponCode() {

    try {

      if (this.isFirst50Applied) {

        this.common.alertmessage(

          'FIRST50 already applied',

          'warning',

          'warning'

        );

        return;

      }

      if (!this.couponCode) {
        return;
      }

      const body = {

        couponCode:
          this.couponCode,

        adminId:
          this.adminId,

        customerId:
          this.auth.getSession()?.userId,

        storeIds:

          this.storeSections.map(

            (x: any) => x.storeId

          )

      };

      this.loadingcoupon = true;

      const res: any =

        await this.http.post(

          this.api.baseUrl +

          '/customer/validate-coupon',

          body

        ).toPromise();

      this.loadingcoupon = false;

      if (!res.success) {

        this.common.alertmessage(

          res.message,

          'warning',

          'warning'

        );

        return;

      }

      this.selectedCoupon =
        res.coupon;

      this.calculateFinalTotals();

    }

    catch (e) {

      console.log(e);

    }

  }

  // =====================================================
  // REMOVE COUPON
  // =====================================================

  removeCoupon() {

    this.selectedCoupon = null;

    this.couponCode = '';

    this.calculateFinalTotals();

  }

  // =====================================================
  // WISHLIST
  // =====================================================

  // =====================================================
  // REALTIME WISHLIST
  // =====================================================

  syncWishlistRealtime() {

    const wishlist =
      this.wishlistService
        .getWishlist();

    // remove deleted

    this.wishlistItems =
      this.wishlistItems.filter(

        (x: any) =>

          wishlist.includes(x._id)

      );

    // find new ids

    const existingIds =
      this.wishlistItems.map(
        (x: any) => x._id
      );

    const newIds =
      wishlist.filter(

        (id: any) =>

          !existingIds.includes(id)

      );

    // fetch only new items

    if (newIds.length > 0) {

      this.fetchWishlistItems(
        newIds
      );

    }

  }

  // =====================================================
  // FETCH WISHLIST ITEMS
  // =====================================================
  loadingwishlistitems = false;
  async fetchWishlistItems(
    ids: string[]
  ) {

    try {

      const body = {

        cartItemIds: [],

        wishlistItemIds: ids,

        adminId: this.adminId

      };
      this.loadingwishlistitems = true;

      const res: any =
        await this.http.post(

          this.api.baseUrl
          + '/customer/get-cart-items',

          body

        ).toPromise();
      this.loadingwishlistitems = false;

      const incoming =
        res.wishlistItems || [];

      const map = new Map();

      this.wishlistItems.forEach(
        (item: any) => {

          map.set(item._id, item);

        }
      );

      incoming.forEach(
        (item: any) => {

          map.set(item._id, item);

        }
      );

      this.wishlistItems =
        Array.from(map.values());

    }

    catch (e) {

      console.log(e);

    }

  }

  // =====================================================
  // MOVE TO WISHLIST
  // =====================================================

  moveToWishlist(item: any) {

    this.wishlistService.add(item._id);

    let cart =
      this.common.getCart();

    cart = cart.filter((x: any) =>

      x.itemid != item._id

    );

    this.common.setCart(cart);

    this.common.alertmessage(

      'Moved to wishlist and removed from cart ', 'info', 'info');

  }
  // =====================================
  // VARIABLE
  // =====================================

  showAddressError = false;
  // =====================================================
  // PLACE ORDER
  // =====================================================
  placingorder = false;
  async placeOrder() {
    console.log('placeOrder');
    try {

      if (this.singleDelievryBoyOrMultipleDelievryBoyForAllStores !== 'Single') {
        if (this.storeSections.length > 1) {
          if (this.paymentMethod == 'cod') {
            this.common.alertmessage("You have to pay online, if you are orderning from multiple store together");
            this.common.alertmessage("Agar aap ek se jyada store se item order karte h to apko payment online karni padegi...");
            this.paymentMethod = 'online';
            return;
          }
        }

      }
      // =====================================
      // ADDRESS CHECK
      // =====================================

      if (!this.selectedAddress) {

        this.showAddressError = true;

        setTimeout(() => {

          this.showAddressError = false;

        }, 2000);

        this.common.alertmessage(

          'Please select address',

          'warning',

          'warning'

        );

        return;

      }

      // =====================================
      // START LOADING
      // =====================================

      this.placingorder = true;

      this.loadingspinner = true;

      // =====================================
      // ORDER OBJECT
      // =====================================

      const orderObj = {

        cart:
          this.storeSections,

        couponcode:
          this.selectedCoupon?.code ? this.selectedCoupon.code : this.isFirst50Applied ? 'FIRST50' : null,


        discountAmount: this.couponDiscount + this.first50Discount,
        handlingCharge:
          this.handlingCharge || 0,
        deliverydiscount:
          this.deliveryDiscount || 0,

        deliveryCharge:
          this.deliveryCharge || 0,

        totalamount:
          this.grandTotal,

        customerId:
          this.auth.getSession()?.userId,

        adminId:
          this.adminId,

        selectedaddress:
          this.selectedAddress,

        deleveryinstruction:
          this.deliveryInstruction,
        profit: this.profit,
        paymentMethod:
          this.paymentMethod,
        amountfromwallet: this.amountfromwallet,
        paymentStatus: this.paymentMethod == 'cod' ? 'pending' : 'pending'
      };


      // =====================================
      // API CALL
      // =====================================

      const res: any =
        await this.http
          .post(

            this.api.baseUrl +
            '/order/create-order',

            orderObj

          )
          .toPromise();

      console.log(res);

      // =====================================
      // SUCCESS
      // =====================================

      if (res?.success) {



        if (this.paymentMethod == 'online') {

          if (this.grandTotal > 0) {

            //  this.common.alertmessage("Online payment integration coming soon!", "info", "info");
            this.popupService.stack = [];

            let userdetails = this.auth.getSession().user;

            this.router.navigate([

              '/onlinepayment',

              res?.order?._id,
              'main', userdetails.name, userdetails.mobile

            ]);
          } else {

            this.popupService.stack = [];
            this.router.navigate([

              '/ordersuccess',

              res?.order?._id,
              'main'

            ]);

          }
        } else {
          this.popupService.stack = [];
          this.router.navigate([

            '/ordersuccess',

            res?.order?._id,
            'main'

          ]);

        }


        this.common.clearCart();
      } else {
        this.common.alertmessage(

          res?.message ||

          'Order failed',

          'error',

          'error'

        );
      }



    }

    catch (e: any) {

      console.log(e);

      // =====================================
      // ONLINE PAYMENT FAIL
      // =====================================


      // =====================================
      // COD FAIL ALERT
      // =====================================

      this.common.alertmessage(

        e?.error?.message ||

        'Something went wrong',

        'error',

        'error'

      );

    }

    finally {

      this.placingorder = false;

      this.loadingspinner = false;

    }

  }

  // =====================================================
  // UI
  // =====================================================

  onCouponFocus() {

    setTimeout(() => {

      this.couponInputWrapper
        ?.nativeElement
        ?.scrollIntoView({

          behavior: 'smooth',

          block: 'start'

        });

    }, 300);

  }

  scrollToCoupons() {

    this.couponSection
      ?.nativeElement
      ?.scrollIntoView({

        behavior: 'smooth'

      });

  }

  // =====================================================
  // AREA
  // =====================================================

  getAreas() {

    this.api.getAreas()
      .subscribe((res: any) => {

        if (res.success) {

          const area =

            res.areas.find(

              (x: any) =>

                x._id ==

                this.common.selectedaddress?.city

            );

          this.common.selectedaddress.cityName =

            area?.cityName;

        }

      });

  }

  // =====================================================
  // ADDRESS ICON
  // =====================================================

  getAddressIcon() {

    const label =

      this.common
        .selectedaddress?.label;

    if (label == 'home') {
      return 'ri-home-4-line';
    }

    if (label == 'office') {
      return 'ri-building-line';
    }

    return 'ri-map-pin-line';

  }

  // =====================================================
  // NAVIGATION
  // =====================================================

  gotohome() {

    this.popupService.close();

    this.router.navigate(['/']);

  }

  goToSearch() {

    this.popupService.open(
      'searchitem',
      'global'
    );

  }

  goBack() {

    this.popupService.close();

  }

  openaddressaddselect() {

    this.popupService.open(
      'addressaddselect',
      'cart'
    );

  }



}