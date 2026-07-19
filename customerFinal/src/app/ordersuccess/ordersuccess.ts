import {
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';
import { Subscription } from 'rxjs';

import {
  ActivatedRoute,
  Router,
  RouterModule
} from '@angular/router';

import { Common } from '../services/common';
import { AuthService } from '../services/auth';
import { ApiService } from '../services/api';
import { PopupService } from '../services/popup';
import { Subheader } from '../subheader/subheader';

@Component({
  selector: 'app-ordersuccess',
  standalone: true,
  templateUrl: './ordersuccess.html',
  styleUrls: ['./ordersuccess.css'],
  imports: [
    CommonModule,
    RouterModule, Subheader
  ]
})

export class Ordersuccess implements OnInit, OnDestroy {

  orderId: string = '';
  ordertype: string = '';

  loading: boolean = true;

  a?: Subscription;
  orderData: any = null;
  ngOnDestroy() {

    this.a?.unsubscribe();
  }
  constructor(

    public common: Common,

    private auth: AuthService,

    private api: ApiService,

    public popupService: PopupService,

    private router: Router,

    private route: ActivatedRoute

  ) { }

  ngOnInit(): void {

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });

    this.route.params.subscribe((params: any) => {

      this.orderId = params.id;
      this.ordertype = params.ordertype;

      this.getOrderDetails();

    });

  }

  // ============================
  // GET ORDER DETAILS
  // ============================

  getOrderDetails() {

    try {

      this.loading = true;
      this.a?.unsubscribe();
      this.a = this.api.getorderbyid(

        {
          orderid: this.orderId,
          ordertype: this.ordertype
        }
      ).subscribe((response: any) => {

        if (response?.success) {
          ;



          this.orderData = response?.order;

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

  // ============================
  // CONTINUE SHOPPING
  // ============================

  continueShopping() {
    this.popupService.stack = [];
    this.router.navigate(['/home']);

  }

}