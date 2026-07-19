import {
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
console.log('1', 'orderlist');
import { CommonModule } from '@angular/common';
console.log('2', 'orderlist');

import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
console.log('3', 'orderlist');

import { Subscription } from 'rxjs';
console.log('14', 'orderlist');

import { Common } from '../services/common'; console.log('5', 'orderlist');

import { AuthService } from '../services/auth'; console.log('6', 'orderlist');

import { ApiService } from '../services/api'; console.log('7', 'orderlist');

import { PopupService } from '../services/popup'; console.log('8', 'orderlist');


import { ItemCard } from '../item-card/item-card'; console.log('9', 'orderlist');

import { Subheader } from '../subheader/subheader'; console.log('10', 'orderlist');


@Component({
  selector: 'app-orderdetails',
  standalone: true,
  templateUrl: './orderdetails.html',
  styleUrls: ['./orderdetails.css'],
  imports: [
    CommonModule, ItemCard,
    RouterModule,
    Subheader
  ]
})

export class Orderdetails implements OnInit {


  gotohome() {

    this.popupService.close();

    this.router.navigate(['/']);

  }

  @Input() orderIdandtypeFrompopdata: string = '';

  orderId: string = '';
  ordertype: string = '';
  storeId: string = '';
  userType: string = '';
  loading = true;
  amountfromwallet = 0;
  adminId: any;

  // =====================================================
  // CART
  // =====================================================

  rawCart: any[] = [];


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

  handlingCharge = 0;

  grandTotal = 0;

  totalSaving = 0;

  // =====================================================
  // FIRST ORDER
  // =====================================================

  customerOrderCount = 0;



  orderData: any = null;
  // =====================================================
  // UI
  // =====================================================

  setmeafetr2sectrue = false;

  // =====================================================
  // SUBSCRIPTIONS
  // =====================================================

  // =====================================================
  // CONSTRUCTOR
  // =====================================================

  constructor(

    public common: Common,

    private auth: AuthService,

    private api: ApiService,



    private http: HttpClient,

    private router: Router,

    private route: ActivatedRoute,
    public popupService: PopupService

  ) { console.log('12', 'orderlist'); }

  ngOnInit() {
    console.log('13', 'orderlist');
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });

    this.adminId =
      this.auth.getAdminId();
    console.log("com ehere order details", this.orderIdandtypeFrompopdata);
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });

    this.route.params.subscribe((params: any) => {
      if (params.id && params.ordertype) {
        this.orderId = params.id;
        this.ordertype = params.ordertype;
        this.storeId = params.storeId;
        this.userType = params.userType;
      } else {
        this.orderIdandtypeFrompopdata.split('_').length == 4 && (this.orderId = this.orderIdandtypeFrompopdata.split('_')[0]) && (this.ordertype = this.orderIdandtypeFrompopdata.split('_')[1]) && (this.storeId = this.orderIdandtypeFrompopdata.split('_')[2]) && (this.userType = this.orderIdandtypeFrompopdata.split('_')[3])
      }


      this.getOrderDetails();

    });




  }
  payNowforinprogressorder(orderData: any) {
    this.popupService.stack = [];
    let userdetails = this.auth.getSession().user;
    this.router.navigate([

      '/onlinepayment',

      orderData?._id,
      'main', userdetails.name, userdetails.mobile

    ]);
  }
  cancelSubOrder(store: any) {
    this.common.confirmopen('Are you sure you want to cancel this order from ' + store.storeInfo?.storeName + '?').then((res) => {
      if (res) {
        this.api.cancelSubOrder({ customerId: this.orderData.customerId, _id: store._id }).subscribe((response: any) => {
          if (response?.success) {
            this.common.alertmessage('Order from ' + store.storeInfo?.storeName + ' cancelled successfully', 'Success', 'success');
            this.getOrderDetails();
          } else {
            this.common.alertmessage('Failed to cancel suborder', 'Error', 'error');
          }
        }, (err: any) => {
          console.error('Error cancelling suborder:', err);
          this.common.alertmessage('An error occurred while cancelling the suborder', 'Error', 'error');
        });
      }
    });

  }
  showHistory = false;

  getOrderDetails() {

    try {

      this.loading = true;

      this.api.getorderbyid(

        {
          orderid: this.orderId,
          ordertype: this.ordertype
        }
      ).subscribe((response: any) => {

        if (response?.success) {
          this.orderData = response?.order;

          response?.subOrders.forEach((store: any) => {

            store.items.forEach((item: any) => {
              item.itemInfo.quantity = item.mainQty;
            });

          });

          this.storeSections = response?.subOrders;

          console.log(this.storeSections);

          // =====================================
          // EMPTY UI DELAY
          // =====================================

          setTimeout(() => {

            this.setmeafetr2sectrue = true;

          }, 1000);

          this.calculateFinalTotals();

        }
        this.loading = false;
      }, err => {
        this.loading = false;
        console.error('Error fetching order details:', err);
      });

    } catch (error) {

      console.error('Error fetching order details:', error);
      this.loading = false;

    }


  }


  // =====================================================
  // DESTROY
  // =====================================================

  ngOnDestroy(): void {


  }



  // =====================================================
  // LOAD CART DATA
  // =====================================================
  loadingspinner = false;
  loadcartres: any = {};

  openStore(store: any) {
    this.popupService.open('storedetails', store.storeInfo._id);

  }

  // =====================================================
  // ORDER COUNT
  // =====================================================



  // =====================================================
  // TOTALS
  // =====================================================

  calculateFinalTotals() {

    this.itemTotal = 0;

    this.storeSections
      .forEach((store: any) => {
        if (store.suborderstatus != 'Cancelled') {
          this.itemTotal +=
            Number(store.storeTotal || 0);
        }



      });

    // =========================================
    // FIRST50
    // =========================================




    this.couponDiscount = this.orderData.discountAmount || 0;



    // =========================================
    // DELIVERY
    // =========================================

    this.deliveryCharge = this.orderData.deliveryCharge || 0;

    this.deliveryDiscount = this.orderData.deliverydiscount || 0;
    this.handlingCharge = this.orderData.handlingCharge || 0;
    this.amountfromwallet = this.orderData.amountfromwallet || 0;




    // =========================================
    // GRAND TOTAL
    // =========================================

    this.grandTotal =

      this.itemTotal

      - this.couponDiscount


      + this.deliveryCharge

      - this.deliveryDiscount - this.amountfromwallet

      + this.handlingCharge;

    // =========================================
    // SAVING
    // =========================================

    this.totalSaving =

      this.couponDiscount +

      this.deliveryDiscount;

  }

  // =====================================================
  // COUPONS
  // =====================================================



  // =====================================================
  // APPLY COUPON
  // =====================================================


  // =====================================================
  // APPLY COUPON CODE
  // =====================================================



  // =====================================================
  // REMOVE COUPON
  // =====================================================



  // =====================================================
  // FETCH WISHLIST ITEMS
  // =====================================================


  // =====================================================
  // MOVE TO WISHLIST
  // =====================================================


  // =====================================
  // VARIABLE
  // =====================================

  // =====================================================
  // UI
  // =====================================================



  // =====================================================
  // AREA
  // =====================================================



  // =====================================================
  // ADDRESS ICON
  // =====================================================



  // =====================================================
  // NAVIGATION
  // =====================================================




  goBack() {

    this.popupService.close();

  }
  changepaymentmethodtocod(orderData: any) {
    this.loading = true;
    this.api.changepaymentmethodtocod(orderData._id).subscribe({

      next: () => {
        this.loading = false;
        orderData.paymentMethod = 'cod';
        this.common.alertmessage(

          'Payment method changed successfully',

          'success',

          'success'

        );



      },

      error: (e: any) => {

        console.log(e);

        this.common.alertmessage(

          e?.error?.message ||

          'Something went wrong',

          'warning',

          'warning'

        );

      }

    });
  }
  trackdeleveryboy(_id: any) {
    this.popupService.open('deliveryboytrack', _id + "_customer");

  }
}