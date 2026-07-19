
import {
  Component,
  OnInit
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  ActivatedRoute,
  RouterModule
} from '@angular/router';

import {
  HttpClient
} from '@angular/common/http';

import { ApiService } from '../services/api';
import { AuthService } from '../services/auth';
import { Common } from '../services/common';

@Component({
  selector: 'app-customerorder',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ],
  templateUrl: './customerorder.html',
  styleUrls: ['./customerorder.css']
})

export class Customerorder implements OnInit {

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,

    private api: ApiService,

    private auth: AuthService,

    public common: Common

  ) {

  }
customerId:any;
  loading = false;

  allOrders: any[] = [];

  groupedOrders: any[] = [];


  selectedFilter = 'All';

  filters = [

    'All',

    'Pending',

    'Delivered',

    'Returned',

    'Cancelled'

  ];
  usertype: any = '';

  currentUserId: any = '';

  // ==========================================
  // INIT
  // ==========================================
  canAssignOrder(order: any): boolean {
    return order?.subOrders?.some(
      (sub: any) =>
        !sub.deliveryBoyId &&
        sub.suborderstatus !== 'Cancelled'
    );
  } currentUserName: any = '';
  currentUserMobile: any = '';
  ngOnInit(): void {
     this.customerId = this.route.snapshot.paramMap.get('id');
    const session =
      this.auth.getSession();

    this.usertype =
      session?.userType;

    // DELIVERY BOY
    if (
      this.usertype ==
      'deliveryboy'
    ) {
      // this.currentUserName = session?.user?.name || '';
      // this.currentUserMobile = session?.user?.mobile || '';
      // this.currentUserId =
      //   session?.userId;
      this.auth.logoutredirect();
    }

    // STORE
    else if (
      this.usertype ==
      'store'
    ) {

      this.currentUserId =
        localStorage.getItem(
          'userId'
        );

      this.currentStoreId =
        localStorage.getItem(
          'storeId'
        );

    }

    // ADMIN
    else if (
      this.usertype ==
      'admin'
    ) {

      this.currentUserId =
        localStorage.getItem(
          'adminId'
        );

    }

    this.getOrders();

  }
  underpreperation(order: any, suborder: any, keywillbenow: any) {
    this.changestatus(order, suborder, keywillbenow, '');

  }

  acceptRejectSuborderbyStore(order: any, suborder: any, keywillbenow: any) {
    this.changestatus(order, suborder, keywillbenow, '');
  }
  packitem(order: any, suborder: any, keywillbenow: any) {
    this.changestatus(order, suborder, keywillbenow, '');
  }
  pickfromstore(order: any, suborder: any, keywillbenow: any) {
    this.changestatus(order, suborder, keywillbenow, '');
  }
  deliveredme(order: any, suborder: any, keywillbenow: any) {

    let singleDelievryBoyOrMultipleDelievryBoyForAllStores = 'NO';

    // all suborders
    const allSubOrders = order?.subOrders || [];

    // current delivery boy id
    const currentDeliveryBoyId =
      suborder?.deliveryBoyId?._id || suborder?.deliveryBoyId;

    // check:
    // all suborders have same delivery boy or not
    const allSameDeliveryBoy = allSubOrders.every((s: any) => {

      const id = s?.deliveryBoyId?._id || s?.deliveryBoyId;

      return String(id) === String(currentDeliveryBoyId);

    });

    if (allSameDeliveryBoy) {

      singleDelievryBoyOrMultipleDelievryBoyForAllStores = 'YES';

      // check all OTHER stores are pickedorder
      const otherStoresNotPicked = allSubOrders.some((s: any) => {

        // skip current suborder
        if (
          String(s?._id) === String(suborder?._id)
        ) {
          return false;
        }

        return s?.currentstatuskey !== 'pickedorder';

      });

      if (otherStoresNotPicked) {

        this.common.alertmessage(
          'Kyuki aap hi saare stores ke order deliver kar rahe ho, isliye pehle sabhi stores se order pick karo. Tabhi delivery ho payegi.'
          , 'warning', 'warning');

        return;

      }

    }

    this.changestatus(
      order,
      suborder,
      keywillbenow,
      singleDelievryBoyOrMultipleDelievryBoyForAllStores
    );

  }
  changestatus(order: any, suborder: any, keywillbenow: any, singleDelievryBoyOrMultipleDelievryBoyForAllStores: any = '') {
    this.loading = true;

    this.http.post(
      this.api.baseUrl + '/order/change-suborder-status',
      {
        subOrderId: suborder._id,
        statuskey: keywillbenow,
        storeTotal: suborder.storeTotal,
        actionById: this.currentUserId,
        actionByType: 'Store'
      }
    )
      .subscribe({
        next: (response: any) => {
          this.loading = false;
          this.common.alertmessage(response?.message, 'Success', 'success');
          if (response?.success) {
            this.getOrders();
          }

        },
        error: (err) => {
          console.log(err);
          this.loading = false;
          this.common.alertmessage('Failed to change status of order', 'Error', 'error');
        }
      });
  }


  assignordertoDeliveryBoy(order: any) {
    this.loading = true;

    this.http.post(
      this.api.baseUrl + '/order/assign-main-order-and-sub-order-to-deliveryboy',
      {
        orderMainId: order.mainOrder._id,
        deliveryBoyId: this.currentUserId,
        deliveryBoyName: this.currentUserName,
        deliveryBoyMobile: this.currentUserMobile,
        actionById: this.currentUserId
      }
    )
      .subscribe({
        next: (response: any) => {
          this.loading = false;
          this.common.alertmessage(response?.message, 'Success', 'success');
          if (response?.success) {
            this.getOrders();
          }

        },
        error: (err) => {
          console.log(err);
          this.loading = false;
          this.common.alertmessage('Failed to assign order to delivery boy', 'Error', 'error');
        }
      });
  }
  // ==========================================
  // GET ORDERS
  // ==========================================

  getOrders() {

    try {

      this.loading = true;

      
      this.http.get(

        this.api.baseUrl +

        `/order/customer-orders/${this.customerId}`

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
  // GROUP
  // ==========================================
  currentStoreId: any = '-1';
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

  changeFilter(filter: string) {

    this.selectedFilter =
      filter;

    this.applyFilter();

  }
  applyFilter() {

    this.groupOrders();

  }
  // ==========================================
  // TOTAL ITEMS
  // ==========================================

  getTotalItems(items: any[]) {

    let total = 0;

    for (const item of items) {

      total +=
        item?.mainQty || 1;

    }

    return total;

  }

  // ==========================================
  // DATE
  // ==========================================

  formatDate(date: any) {

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
  // OPEN
  // ==========================================
  //    this.popupService.open('orderdetails', subOrder.orderId + "_main_" + subOrder?.storeInfo?._id + "_customer");

  singleDelievryBoyOrMultipleDelievryBoyForAllStores = 'Single';
  openorder(order: any) {
    if (this.usertype == 'admin' || this.usertype == 'deliveryboy') {
      this.openMainOrder(order);
    } else {
      return;
    }
  }

  openMainOrder(order: any) {

    window.open(

      this.common.appwaliwebsite +
      '/order-details/' +
      order?.mainOrder?._id +
      "/main/-1/" +

      this.usertype,
      '_blank'
    );

  }

  openSubOrder(order: any,
    sub: any,
    event: any
  ) {

    event.stopPropagation();


    window.open(

      this.common.appwaliwebsite +
      '/order-details/' +
      order?.mainOrder?._id +
      "/main/" +
      sub?.storeId +
      "/" +

      this.usertype,
      '_blank'
    );

  }

  refreshOrders() {

    this.getOrders();

  }

}