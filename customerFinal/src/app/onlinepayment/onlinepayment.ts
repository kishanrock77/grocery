



import {
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  ActivatedRoute,
  Router,
  RouterModule
} from '@angular/router';

import { Subscription } from 'rxjs';

import { Common } from '../services/common';
import { AuthService } from '../services/auth';
import { ApiService } from '../services/api';
import { PopupService } from '../services/popup';
import { Subheader } from '../subheader/subheader';

declare var Razorpay: any;
@Component({
  selector: 'app-onlinepayment',
  standalone: true,
  templateUrl: './onlinepayment.html',
  styleUrls: ['./onlinepayment.css'],
  imports: [
    CommonModule,
    RouterModule, Subheader
  ]
})

export class Onlinepayment implements OnInit, OnDestroy {

  orderId: string = '';
  ordertype: string = '';

  loading: boolean = true;

  orderData: any = null;

  routeParamsSubscription?: Subscription;
  orderDetailsSubscription?: Subscription;
  createOrderSubscription?: Subscription;
  completeOrderSubscription?: Subscription;

  messageListener = (event: MessageEvent) => {
    if (event.data?.type === 'PAYMENT_CHECK') {
      this.getOrderDetails(true);
    }
  };

  constructor(

    public common: Common,

    private auth: AuthService,

    private api: ApiService,

    public popupService: PopupService,

    private router: Router,

    private route: ActivatedRoute

  ) { }
  userdetails: any = {};

  ngOnInit(): void {

    window.addEventListener(
      'message',
      this.messageListener
    );
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });

    this.routeParamsSubscription?.unsubscribe();
    this.routeParamsSubscription = this.route.params.subscribe((params: any) => {

      this.orderId = params.id;
      this.ordertype = params.ordertype;
      this.userdetails = { name: params.name, mobile: params.mobile };
      this.getOrderDetails();

    });

  }

  // ============================
  // GET ORDER DETAILS
  // ============================

  getOrderDetails(fromevent=false) {

    try {

      this.loading = true;

      this.orderDetailsSubscription?.unsubscribe();

      this.orderDetailsSubscription = this.api.getorderbyid(

        {
          orderid: this.orderId,
          ordertype: this.ordertype
        }
      ).subscribe((response: any) => {

        if (response?.success) {




          this.orderData = response?.order;

          if (this.orderData.paymentStatus == 'pending') {
            if(!fromevent){
            this.continueToOnlinePayment();
            }else{
              this.opentryagain=true;
            }
          }else{
             if(fromevent){
            this.goToOrderlist();
            }
          }

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

  // ============================
  // GO TO ORDER DETAILS
  // ============================

  goToOrderDetails() {
    this.popupService.stack = [];
    this.router.navigate([
      '/order-details',
      this.orderId,
      this.ordertype, '-1', 'customer'
    ]);

  }

  goToOrderlist(){
     this.popupService.stack = [];
    this.router.navigate([
      '/orderlist',  '-1' 
    ]);
  }

  // ============================
  // CONTINUE SHOPPING
  // ============================

  continueShopping() {
    this.popupService.stack = [];
    this.router.navigate(['/home']);

  }


  ///razor pay
  order_id_for_backend = ''; orderid = '';
  amount = 0;
  subs: any;
  options: any;
  continueToOnlinePayment() {
    this.options = {

    };

    this.ceatebackendorderforazorpay();
  }

  istransactioncancelled = false; opentryagain = false;
  ceatebackendorderforazorpay() {


    this.istransactioncancelled = false;
    this.loading = true;
    this.opentryagain = false;
    this.createOrderSubscription?.unsubscribe();

    this.createOrderSubscription = this.api.ceatebackendorderforazorpay(this.orderId, this.orderData.customerId, this.orderData.totalamount).subscribe((res: any) => {
      this.loading = false;

      this.options = {
        "key": res.key, // Enter the Key ID generated from the Dashboard
        "amount": this.orderData.totalamount * 100, // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
        "name": this.common.brandname,
        "description": this.orderData?.mainorderid + " payment !",
        "image": this.common.appwaliwebsite + "/boy.gif",
        "currency": "INR",
        "order_id": res.rajororder.id, //This is a sample Order ID. Pass the `id` obtained in the response of Step 1
        
        "prefill": {
          "name": this.userdetails.name,
          "email": 'kishanrock777@gmail.com',
          "contact": this.userdetails.mobile,
        },
        "notes": res.rajororder.notes,
        "theme": {
          "color": "#f8cc24"
        },
        modal: {
          // We should prevent closing of the form when esc key is pressed.
          escape: false,
        },
"handler": (res: any) => {
      console.log(res);
    }

      };
      this.options.handler = ((response: any, error: any) => {
        this.options.response = response;
        console.log(response);
        console.log(this.options);
        // call your backend api to verify payment signature & capture transaction

        var obj = {
          "transaction_details": response, "customerId": this.orderData.customerId,
          "email": 'kishanrock777@gmail.com',
          "amount_paid": this.amount,
          "order_id": res.order_id, "transaction_id": response.razorpay_order_id
        };
 
  //this.common.alertmessage('Calling completeorder', 'info', 'info');
        this.completeorder(response, res.order_id, this.orderData.customerId);
      });
      this.options.modal.ondismiss = (() => {
        // handle the case when user closes the form while transaction is in progress
        console.log('Transaction cancelled.');
        this.istransactioncancelled = true;

      //  this.common.alertmessage('Transaction cancelled.', 'warning', 'warning');

      });
      try {
        const insideIframe =
          window.self !== window.top ||
          window.location !== window.parent.location;

        if (
          insideIframe &&
          (window.parent)
        ) {

          const paymentUrl =
            window.location.href;

          window.parent.postMessage({
            type: 'OPEN_EXTERNAL_PAYMENT',
            url: paymentUrl
          }, '*');
          return;
        }

        var rzp1 = new Razorpay(this.options);

        var rzp1 = new Razorpay(this.options);
        rzp1.on('payment.failed', function (response: any) {

          console.log(response.error);


        });
        rzp1.open();
      }
      catch (e) {
        this.opentryagain = true;
        console.log(e);//   location.reload();
      }



    },
      (err: any) => {
        this.opentryagain = true;
        this.loading = false;
      });
  }


  completeorder(obj: any, order_id: any, customerId: any) {
    this.loading = true;

    this.completeOrderSubscription?.unsubscribe();

    this.completeOrderSubscription = this.api.completeorderforrazorpay(obj, order_id, customerId, this.amount).subscribe((response: any) => {
      this.loading = false;
  
      if (response.success) {
 
location.reload();
  
       // this.common.alertmessage("Payment successful.", 'success', 'success');

      } else {
          this.opentryagain = true;
      //  this.common.alertmessage('Payment failed. Please try again later.', 'error', 'error');
        //this.router.navigate(['/dashboard']);
      }
   
    }, (err: any) => { 

      this.loading = false;
          this.opentryagain = true;
     // this.common.alertmessage('Payment failed. Please try again later.', 'error', 'error');
 
      // this.router.navigate(['/dashboard']);
    }
    );
  }
  ////razor pay end

  ngOnDestroy(): void {
    window.removeEventListener(
      'message',
      this.messageListener
    );

    this.routeParamsSubscription?.unsubscribe();
    this.orderDetailsSubscription?.unsubscribe();
    this.createOrderSubscription?.unsubscribe();
    this.completeOrderSubscription?.unsubscribe();
  }
}
