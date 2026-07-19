import {
  Component,
  OnInit
} from '@angular/core';

import {
  HttpClient
} from '@angular/common/http';

import {
  CommonModule
} from '@angular/common';

import {
  Router,
  RouterModule
} from '@angular/router';

import { Common } from '../services/common';
import { AuthService } from '../services/auth';
import { ApiService } from '../services/api';
import { PopupService } from '../services/popup';
import { Subheader } from '../subheader/subheader';
import { Footer } from '../footer/footer';
@Component({
  selector: 'app-orderlist',
  standalone: true,
  templateUrl: './orderlist.html',
  styleUrls: ['./orderlist.css'],
  imports: [
    CommonModule,
    RouterModule, Footer,
    Subheader
  ]
})

export class Orderlist implements OnInit {

  constructor(

    public common: Common,

    private auth: AuthService,

    private http: HttpClient,

    private api: ApiService,

    public popupService: PopupService,

    private router: Router

  ) { }

  // ==========================================
  // DATA
  // ==========================================
  payNowforinprogressorder(orderData: any) {
    this.popupService.stack = [];
    let userdetails = this.auth.getSession().user;
    this.router.navigate([

      '/onlinepayment',

      orderData?._id,
      'main', userdetails.name, userdetails.mobile

    ]);
  }
  allOrders: any[] = [];

  groupedOrders: any[] = [];

  loading = true;

  selectedFilter = 'All';

  filters = [

    'All',

    'Pending',

    'Delivered',

    'Returned',

    'Cancelled'

  ];

  // ==========================================
  // INIT
  // ==========================================

  ngOnInit(): void {

    window.scrollTo({

      top: 0,

      behavior: 'smooth'

    });

    this.getOrders();

  }

  // ==========================================
  // HOME
  // ==========================================

  gotohome() {

    this.router.navigate(['/']);

  }

  // ==========================================
  // GET ORDERS
  // ==========================================

  getOrders() {

    try {

      this.loading = true;

      const customerId =
        this.auth.getSession()?.userId;

      this.http.get(

        this.api.baseUrl +

        `/order/customer-orders/${customerId}`

      )

        .subscribe({

          next: (response: any) => {

            const allOrders = [

              ...(response?.orders?.pending || []),

              ...(response?.orders?.delivered || []),

              ...(response?.orders?.returned || []),

              ...(response?.orders?.cancelled || [])

            ];

            this.allOrders =
              allOrders;

            this.groupOrders();

            this.loading = false;

          },

          error: (err) => {

            console.log(err);

            this.loading = false;

            this.groupedOrders = [];

            this.common.alertmessage(

              "Failed to fetch orders",

              "error",

              "error"

            );

          }

        });

    }

    catch (e) {

      console.log(e);

      this.loading = false;

      this.groupedOrders = [];

      this.common.alertmessage(

        "Failed to fetch orders",

        "error",

        "error"

      );

    }

  }

  // ==========================================
  // GROUP ORDERS
  // ==========================================

  groupOrders() {

    let filtered = [...this.allOrders];

    // FILTER

    if (this.selectedFilter != 'All') {

      filtered = filtered.filter(

        x =>

          x?.subOrder
            ?.suborderstatus
            ?.toLowerCase()

          ==

          this.selectedFilter
            .toLowerCase()

      );

    }

    // GROUP

    const grouped: any = {};

    for (const row of filtered) {

      const mainId =
        row?.mainOrder?._id;

      if (!grouped[mainId]) {

        grouped[mainId] = {

          mainOrder:
            row.mainOrder,

          subOrders: [],

          totalStores: 0,

          totalItems: 0

        };

      }

      grouped[mainId]
        .subOrders
        .push(row.subOrder);

      grouped[mainId]
        .totalStores++;

      grouped[mainId]
        .totalItems +=
        this.getTotalItems(
          row?.subOrder?.items || []
        );

    }

    this.groupedOrders =
      Object.values(grouped);

  }

  // ==========================================
  // FILTER
  // ==========================================

  applyFilter() {

    this.groupOrders();

  }

  // ==========================================
  // CHANGE FILTER
  // ==========================================

  changeFilter(filter: string) {

    this.selectedFilter =
      filter;

    this.applyFilter();

  }

  // ==========================================
  // FORMAT DATE
  // ==========================================

  formatDate(date: any) {

    if (!date) {

      return '';

    }

    return new Date(date)

      .toLocaleString(

        'en-GB',

        {

          day: '2-digit',

          month: 'short',

          year: 'numeric',

          hour: '2-digit',

          minute: '2-digit',

          hour12: true

        }

      )

      .replace(',', '');

  }

  // ==========================================
  // TOTAL ITEMS
  // ==========================================

  getTotalItems(items: any[]) {

    if (!items?.length) {

      return 0;

    }

    let total = 0;

    for (const item of items) {

      total += item.quantity || 1;

    }

    return total;

  }

  // ==========================================
  // OPEN MAIN ORDER
  // ==========================================

  openMainOrder(order: any) {





    this.popupService.open('orderdetails', order?.mainOrder?._id + "_main_-1_customer");



  }

  // ==========================================
  // OPEN SUB ORDER
  // ==========================================

  openSubOrder(
    subOrder: any,
    event: any
  ) {

    event.stopPropagation();
    this.popupService.open('orderdetails', subOrder.orderId + "_main_" + subOrder?.storeInfo?._id + "_customer");



  }
  refreshOrders() {
    this.getOrders();
  }
  // ==========================================
  // CANCEL ORDER
  // ==========================================

  async cancelOrder(
    subOrder: any,
    event: any
  ) {

    try {

      event.stopPropagation();

      if (
        !subOrder?.iscancellable
      ) {

        return;

      }

      const confirm =
        window.confirm(

          'Are you sure you want to cancel this order?'

        );

      if (!confirm) {

        return;

      }

      const body = {

        subOrderId:
          subOrder._id,

        statuskey:
          'cancelledbycustomer',

        actionById:
          this.auth.getSession()?.userId,

        actionByType:
          'Customer'

      };

      this.http.post(

        this.api.baseUrl +

        '/order/change-suborder-status',

        body

      )

        .subscribe({

          next: () => {

            this.common.alertmessage(

              'Order cancelled successfully',

              'success',

              'success'

            );

            this.getOrders();

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

    catch (e: any) {

      console.log(e);

      this.common.alertmessage(

        'Something went wrong',

        'warning',

        'warning'

      );

    }

  }

  // ==========================================
  // SEARCH
  // ==========================================

  goToSearch() {

    this.popupService.open(

      'searchitem',

      'global'

    );

  }

  // ==========================================
  // BACK
  // ==========================================

  goBack() {

    this.popupService.close();

  }
  changepaymentmethodtocod(order: any) {
    this.loading = true;
    this.api.changepaymentmethodtocod(order.mainOrder._id).subscribe({

      next: () => {
        this.loading = false;
        order.mainOrder.paymentMethod = 'cod';
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
}