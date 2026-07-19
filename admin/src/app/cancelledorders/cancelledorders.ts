
import {
  Component,
  OnInit
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  RouterModule
} from '@angular/router';

import {
  HttpClient
} from '@angular/common/http';

import { ApiService } from '../services/api';
import { AuthService } from '../services/auth';
import { Common } from '../services/common';
  
@Component({
  selector: 'app-cancelledorders',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ],
  templateUrl: './cancelledorders.html',
  styleUrls: ['./cancelledorders.css']
})

export class Cancelledorders implements OnInit {

  constructor( 
    private http: HttpClient,
   
    private api: ApiService,

    private auth: AuthService,

    public common: Common

  ) {
     
  }

  loading = false;

  allOrders: any[] = [];

  groupedOrders: any[] = [];

  selectedFilter = 'New';

  filters = [

    'New',

    'In Progress'

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

    this.loading = true;

    this.http.get(

      this.api.baseUrl +

      `/order/role-orders-cancelled/${this.usertype}/${this.currentUserId}/${this.currentStoreId}`

    )

      .subscribe({

        next: (response: any) => {

          this.allOrders = [

            ...(response?.orders?.cancelled || [])

          ];

          this.groupOrders();

          this.loading = false;

        },

        error: (err) => {

          console.log(err);

          this.loading = false;

        }

      });

  }

  // ==========================================
  // GROUP
  // ==========================================
  currentStoreId: any = '-1';
  groupOrders() {

    let filtered = [];

    if (
      this.selectedFilter ==
      'New'
    ) {

      filtered =
        this.allOrders.filter(

          (x: any) => {

            // DELIVERY BOY
            if (
              this.usertype ==
              'deliveryboy'
            ) {

              return !x?.subOrder
                ?.deliveryBoyId;

            }

            // STORE
            else if (
              this.usertype ==
              'store'
            ) {

              return !x?.subOrder
                ?.finalstoreId;

            }

            // ADMIN
            else {

              return (

                !x?.subOrder
                  ?.finalstoreId ||

                !x?.subOrder
                  ?.deliveryBoyId

              );

            }

          }

        );

    }

    else {

      filtered =
        this.allOrders.filter(

          (x: any) => {

            // DELIVERY BOY
            if (
              this.usertype ==
              'deliveryboy'
            ) {

              return x?.subOrder
                ?.deliveryBoyId ==
                this.currentUserId;

            }

            // STORE
            else if (
              this.usertype ==
              'store'
            ) {

              return x?.subOrder
                ?.finalstoreId ==
                this.currentStoreId;

            }

            // ADMIN
            else {

              return (

                x?.subOrder?.finalstoreId &&

                x?.subOrder?.deliveryBoyId &&

                x?.subOrder?.suborderstatus == 'Pending'

              );

            }

          }

        );

    }

    // ==========================================
    // GROUP
    // ==========================================

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

    this.groupedOrders = [
      ...Object.values(grouped)
    ];

  }

  // ==========================================
  // FILTER
  // ==========================================

  changeFilter(filter: string) {

    this.selectedFilter = filter;

    this.groupedOrders = [];

    setTimeout(() => {

      this.groupOrders();

    });

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