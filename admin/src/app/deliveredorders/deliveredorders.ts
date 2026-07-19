
import {
  Component,
  OnInit
} from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
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
import { NotificationService } from '../services/notification.service';
import { FcmService } from '../services/fcm';

@Component({
  selector: 'app-deliveredorders',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, FormsModule],
  templateUrl: './deliveredorders.html',
  styleUrls: ['./deliveredorders.css']
})

export class Deliveredorders implements OnInit {
  fromDate: string = '';
  toDate: string = '';
  constructor(
    private fcm: FcmService,
    private http: HttpClient,
    private notificationService:
      NotificationService,
    private api: ApiService,

    private auth: AuthService,

    public common: Common

  ) {
    this.notificationService
      .requestPermission();
  }
  selectedDateRange = 'currentMonth';
  loading = false;

  allOrders: any[] = [];

  groupedOrders: any[] = [];

  selectedFilter = 'All';

  filters = [

    'All',

    'Settled',

    'Non Settled',
    'Settled for Delivery boy',

    'Settled for store',
    'Non Settled for Delivery boy',

    'Non Settled for store'

  ];

  usertype: any = '';

  currentUserId: any = '';

  // ==========================================
  // INIT
  // ==========================================
  onManualDateChange() {

    this.selectedDateRange = '';

  }
  onDateRangeChange() {

    const today = new Date();

    let from = new Date();
    let to = new Date();

    switch (this.selectedDateRange) {

      case 'today':

        break;

      case 'yesterday':

        from.setDate(today.getDate() - 1);
        to.setDate(today.getDate() - 1);

        break;

      case 'currentWeek':

        const currentWeekDay = today.getDay();

        from = new Date(today);
        from.setDate(today.getDate() - currentWeekDay);

        break;

      case 'lastWeek':

        const lastWeekDay = today.getDay();

        from = new Date(today);
        from.setDate(today.getDate() - lastWeekDay - 7);

        to = new Date(today);
        to.setDate(today.getDate() - lastWeekDay - 1);

        break;

      case 'last7Days':

        from = new Date(today);
        from.setDate(today.getDate() - 6);

        break;

      case 'currentMonth':

        from = new Date(
          today.getFullYear(),
          today.getMonth(),
          1
        );

        break;

      case 'lastMonth':

        from = new Date(
          today.getFullYear(),
          today.getMonth() - 1,
          1
        );

        to = new Date(
          today.getFullYear(),
          today.getMonth(),
          0
        );

        break;

      case 'last30Days':

        from = new Date(today);
        from.setDate(today.getDate() - 29);

        break;

      case 'last3Months':

        from = new Date(today);
        from.setMonth(today.getMonth() - 3);

        break;

      case 'last6Months':

        from = new Date(today);
        from.setMonth(today.getMonth() - 6);

        break;

    }

    this.fromDate = this.formatDateForInput(from);
    this.toDate = this.formatDateForInput(to);

  }

  setsettledamoutforDboy(sub: any) {
    if (sub.settlementamountfordeliveryboy == undefined || sub.settlementamountfordeliveryboy == null) {
      return;
    }
    this.http.post(
      this.api.baseUrl + '/order/set-settlement-amount-for-deliveryboy',
      {
        subOrderId: sub._id,
        settlementamountfordeliveryboy: sub.settlementamountfordeliveryboy || 0
      }
    )
      .subscribe({
        next: (response: any) => {

          if (response?.success) {
            this.groupOrders();
          } else {
            this.common.alertmessage('Failed to set settlement amount for delivery boy', 'Error', 'error');
          }
        },
        error: (err) => {
          console.log(err);
          this.common.alertmessage('Failed to set settlement amount for delivery boy', 'Error', 'error');
        }
      });
  }
  canAssignOrder(order: any): boolean {
    return order?.subOrders?.some(
      (sub: any) =>
        !sub.deliveryBoyId &&
        sub.suborderstatus !== 'Cancelled'
    );
  } currentUserName: any = '';
  currentUserMobile: any = '';

  formatDateForInput(date: Date): string {

    const year = date.getFullYear();

    const month = String(
      date.getMonth() + 1
    ).padStart(2, '0');

    const day = String(
      date.getDate()
    ).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
  ngOnInit(): void {

    const today = new Date();

    const firstDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    );

    const lastDay = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0
    );

    this.fromDate =
      this.formatDateForInput(firstDay);

    this.toDate =
      this.formatDateForInput(lastDay);

    const session =
      this.auth.getSession();

    this.usertype =
      session?.userType;

    // DELIVERY BOY
    if (
      this.usertype ==
      'deliveryboy'
    ) {
      this.currentUserName = session?.user?.name || '';
      this.currentUserMobile = session?.user?.mobile || '';
      this.currentUserId =
        session?.userId;
      this.filters = [

        'All',

        'Settled',

        'Non Settled',


      ];
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
      this.filters = [

        'All',

        'Settled',

        'Non Settled',


      ];
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
    this.fcm.callme(this.currentUserId, this.usertype);

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
  searchOrders() {
    this.getOrders();
  }
  getOrders() {

    this.loading = true;

    this.http.get(
      this.api.baseUrl +
      `/order/role-orders-delivered/` +
      `${this.usertype}/` +
      `${this.currentUserId}/` +
      `${this.currentStoreId}`,

      {
        params: {
          fromDate: this.fromDate,
          toDate: this.toDate
        }
      }
    )

      .subscribe({

        next: (response: any) => {

          this.allOrders = [

            ...(response?.orders?.delivered || [])

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


  //admin
  totalamountofdeleveredordersforAdmin: any = 0;
  totalamountofSettledforAdmin: any = 0;
  totalamountofNonSettledforAdmin: any = 0;
  totalamountofSettledforAdmin_for_store: any = 0;
  totalamountofNonSettledforAdmin_for_store: any = 0;
  totalamountofSettledforAdmin_for_delieveryboy: any = 0;
  totalamountofNonSettledforAdmin_for_delieveryboy: any = 0;
  //admin end

  totalamountofdeleveredordersforstore: any = 0;

  totalNonsettledamountfordeliveryboy: any = 0;

  totalsettledamountforstore: any = 0;
  totalNonsettledamountforstore: any = 0;
  totalsettledamountfordeliveryboy: any = 0;
  groupOrders() {

    let filtered = [];

    if (
      this.selectedFilter ==
      'All'
    ) {

      filtered =
        this.allOrders;
      // calculate total amount of delivered orders


    }

    else if (
      this.selectedFilter ==
      'Settled'
    ) {

      // DELIVERY BOY
      if (
        this.usertype ==
        'deliveryboy'
      ) {

        filtered =
          this.allOrders.filter(

            (x: any) =>

              x?.subOrder
                ?.settlementdonefordeliveryboy === true

          );

      }

      // STORE
      else if (
        this.usertype ==
        'store'
      ) {

        filtered =
          this.allOrders.filter(

            (x: any) =>

              x?.subOrder
                ?.settlementdoneforstore === true

          );

      }

      // ADMIN
      else {

        const orderGroups: any = {};

        this.allOrders.forEach((row: any) => {

          const mainId =
            String(
              row?.mainOrder?._id
            );

          if (!orderGroups[mainId]) {

            orderGroups[mainId] = [];

          }

          orderGroups[mainId]
            .push(row);

        });

        const settledMainOrderIds =
          Object.keys(orderGroups)
            .filter((mainId) => {

              return orderGroups[mainId]
                .every((row: any) => {

                  return (

                    row?.subOrder
                      ?.settlementdoneforstore === true &&

                    row?.subOrder
                      ?.settlementdonefordeliveryboy === true

                  );

                });

            });

        filtered =
          this.allOrders.filter(

            (x: any) =>

              settledMainOrderIds.includes(

                String(
                  x?.mainOrder?._id
                )

              )

          );

      }

    }
    else if (
      this.selectedFilter ==
      'Non Settled'
    ) {

      filtered =
        this.allOrders.filter(

          (x: any) => {

            // DELIVERY BOY
            if (
              this.usertype ==
              'deliveryboy'
            ) {

              return x?.subOrder
                ?.settlementdonefordeliveryboy ==
                false || x?.subOrder?.settlementdonefordeliveryboy == undefined;

            }

            // STORE
            else if (
              this.usertype ==
              'store'
            ) {

              return x?.subOrder
                ?.settlementdoneforstore ==
                false || x?.subOrder?.settlementdoneforstore == undefined;

            }

            // ADMIN
            else {

              return (

                !x?.subOrder?.settlementdoneforstore ||

                !x?.subOrder?.settlementdonefordeliveryboy

              );

            }

          }

        );

    }
    else if (
      this.selectedFilter ==
      'Settled for Delivery boy'
    ) {

      filtered =
        this.allOrders.filter(

          (x: any) => {



            // ADMIN


            return (

              x?.subOrder?.settlementdonefordeliveryboy

            );



          }

        );

    }
    else if (
      this.selectedFilter ==
      'Settled for store'
    ) {

      filtered =
        this.allOrders.filter(

          (x: any) => {



            // ADMIN


            return (

              x?.subOrder?.settlementdoneforstore

            );



          }

        );

    }
    else if (
      this.selectedFilter ==
      'Non Settled for Delivery boy'
    ) {

      filtered =
        this.allOrders.filter(

          (x: any) => {



            // ADMIN


            return (

              x?.subOrder?.settlementdonefordeliveryboy == false || x?.subOrder?.settlementdonefordeliveryboy == undefined

            );



          }

        );

    }
    else if (
      this.selectedFilter ==
      'Non Settled for store'
    ) {

      filtered =
        this.allOrders.filter(

          (x: any) => {



            // ADMIN


            return (

              x?.subOrder?.settlementdoneforstore == false || x?.subOrder?.settlementdoneforstore == undefined

            );



          }

        );

    }
    // ==========================================
    // GROUP
    // ==========================================

    const grouped: any = {};
    this.totalamountofdeleveredordersforstore = 0;
    this.totalsettledamountforstore = 0;
    this.totalsettledamountfordeliveryboy = 0;
    this.totalNonsettledamountforstore = 0;
    this.totalNonsettledamountfordeliveryboy = 0;
    ///admin
    this.totalamountofdeleveredordersforAdmin = 0;
    this.totalamountofSettledforAdmin = 0;
    this.totalamountofNonSettledforAdmin = 0;
    this.totalamountofSettledforAdmin_for_store = 0;
    this.totalamountofNonSettledforAdmin_for_store = 0;
    this.totalamountofSettledforAdmin_for_delieveryboy = 0;
    this.totalamountofNonSettledforAdmin_for_delieveryboy = 0;
    ///admin end


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

      this.totalamountofdeleveredordersforstore +=
        row?.subOrder?.storeTotaltoshowtostore || 0;
      this.totalNonsettledamountforstore += row?.subOrder?.settlementdoneforstore ? 0 : row?.subOrder?.storeTotaltoshowtostore;
      this.totalsettledamountforstore += row?.subOrder?.settlementdoneforstore ? row?.subOrder?.settlementamountforstore || 0 : 0;



      this.totalsettledamountfordeliveryboy += row?.subOrder?.settlementdonefordeliveryboy ? row?.subOrder?.settlementamountfordeliveryboy || 0 : 0;
      this.totalNonsettledamountfordeliveryboy += row?.subOrder?.settlementdonefordeliveryboy ? 0 : row?.subOrder?.settlementamountfordeliveryboy || 0;



      ///admin
      this.totalamountofdeleveredordersforAdmin = row?.mainOrder?.totalamount;
      this.totalamountofSettledforAdmin = this.totalsettledamountforstore + this.totalsettledamountfordeliveryboy;
      this.totalamountofNonSettledforAdmin = this.totalNonsettledamountfordeliveryboy + this.totalNonsettledamountforstore;
      this.totalamountofSettledforAdmin_for_store = this.totalsettledamountforstore;
      this.totalamountofNonSettledforAdmin_for_store = this.totalNonsettledamountforstore;
      this.totalamountofSettledforAdmin_for_delieveryboy = this.totalsettledamountfordeliveryboy;
      this.totalamountofNonSettledforAdmin_for_delieveryboy = this.totalNonsettledamountfordeliveryboy;
      ///admin end





    }


    this.groupedOrders = [
      ...Object.values(grouped)
    ];

  }

  // ==========================================
  // FILTER
  // ==========================================
  markAsUnsettledForDeliveryBoy_or_store(sub: any, type: any) {
    if (confirm("Are you sure ?")) {
      this.loading2 = true;
      this.http.post(
        this.api.baseUrl + '/order/markAsUnsettledForDeliveryBoy_or_store',
        {
          subOrderId: sub._id,
          type
        }
      )
        .subscribe({
          next: (response: any) => {
            this.loading2 = false;
            if (response?.success) {

              this.getOrders();
            } else {
              this.common.alertmessage('Something is wrong', 'Error', 'error');
            }
          },
          error: (err) => {
            console.log(err);
            this.loading2 = false;
            this.common.alertmessage('Something is wrong', 'Error', 'error');
          }
        });
    }
  }

  settlementMethods = [
    'COD',
    'UPI',
    'NetBanking',
    'Paytm',
    'Paypal',
    'GooglePay'
  ];
  showStoreSettlementPopup = false;
  showDboySettlementPopup = false;

  selectedStoreId = '';
  selectedDeliveryBoyId = '';

  paymentMethod = '';
  transactionId = '';

  settlementDateTime = '';

  uniqueStores: any[] = [];
  uniqueDeliveryBoys: any[] = [];
  selectedStorePendingAmount = 0;
  selectedDeliveryBoyPendingAmount = 0;
  commissiontotakefromstore_percent = 0;
  onStoreChange() {

    this.selectedStorePendingAmount = 0;

    let remainingforstore = 0;
    this.groupedOrders.forEach((order: any) => {

      order.subOrders.forEach((sub: any) => {

        if (
          String(sub.storeId) === String(this.selectedStoreId) &&
          !sub.settlementdoneforstore
        ) {
          this.commissiontotakefromstore_percent = sub.storeInfo.commissionforadmin;
          remainingforstore = sub.storeTotaltoshowtostore - (sub.storeTotaltoshowtostore * this.commissiontotakefromstore_percent / 100);
          this.selectedStorePendingAmount +=
            Number(remainingforstore);

        }

      });

    });

  }
  clicktosettleforstore() {
    this.selectedStorePendingAmount = 0;
    this.selectedDeliveryBoyPendingAmount = 0;
    this.uniqueStores = [];

    this.groupedOrders.forEach((order: any) => {

      order.subOrders.forEach((sub: any) => {

        if (
          !sub.settlementdoneforstore &&
          !this.uniqueStores.find(
            x => x.storeId == sub.storeId
          )
        ) {

          this.uniqueStores.push({
            storeId: sub.storeId,
            storeName: sub?.storeInfo?.storeName
          });

        }

      });

    });
    this.showDboySettlementPopup = false;

    this.showStoreSettlementPopup = true;

  }
  onDeliveryBoyChange() {

    const boy = this.uniqueDeliveryBoys.find(
      x => String(x.deliveryBoyId) === String(this.selectedDeliveryBoyId)
    );

    this.selectedDeliveryBoyPendingAmount =
      boy?.unsettledAmount || 0;

  }
  clicktosettleforDboys() {
    this.selectedStorePendingAmount = 0;
    this.selectedDeliveryBoyPendingAmount = 0;
    this.showStoreSettlementPopup = false;
    this.uniqueDeliveryBoys = [];

    this.groupedOrders.forEach((order: any) => {

      order.subOrders.forEach((sub: any) => {

        if (!sub.deliveryBoyId) {
          return;
        }

        const existingBoy =
          this.uniqueDeliveryBoys.find(
            (x: any) =>
              String(x.deliveryBoyId) ===
              String(sub.deliveryBoyId)
          );

        if (existingBoy) {

          if (
            !sub.settlementdonefordeliveryboy
          ) {

            existingBoy.unsettledAmount +=
              Number(
                sub.settlementamountfordeliveryboy || 0
              );

          }

        } else {

          this.uniqueDeliveryBoys.push({

            deliveryBoyId: sub.deliveryBoyId,

            deliveryBoyName:
              sub.deliveryBoyName || 'Unknown',

            unsettledAmount:
              !sub.settlementdonefordeliveryboy
                ? Number(
                  sub.settlementamountfordeliveryboy || 0
                )
                : 0

          });

        }

      });

    });

    // sirf wahi delivery boys rakho
    // jinka settlement pending hai

    this.uniqueDeliveryBoys =
      this.uniqueDeliveryBoys.filter(
        (x: any) => x.unsettledAmount > 0
      );

    this.selectedDeliveryBoyId = '';

    this.selectedDeliveryBoyPendingAmount = 0;

    this.paymentMethod = '';

    this.transactionId = '';

    this.settlementDateTime = '';

    this.showDboySettlementPopup = true;

  }
  loading2 = false;
  saveDeliveryBoySettlement() {

    if (!this.selectedDeliveryBoyId) {

      this.common.alertmessage(
        'Please select delivery boy',
        'Warning',
        'warning'
      );

      return;
    }

    if (!this.paymentMethod) {

      this.common.alertmessage(
        'Please select payment method',
        'Warning',
        'warning'
      );

      return;
    }

    if (!this.settlementDateTime) {

      this.common.alertmessage(
        'Please select settlement date',
        'Warning',
        'warning'
      );

      return;
    }

    if (
      this.paymentMethod !== 'COD' &&
      !this.transactionId
    ) {

      this.common.alertmessage(
        'Please enter transaction id',
        'Warning',
        'warning'
      );

      return;
    }

    this.loading2 = true;

    this.http.post(
      this.api.baseUrl +
      '/order/settle-deliveryboy-payments',
      {
        deliveryBoyId: this.selectedDeliveryBoyId,
        paymentMethod: this.paymentMethod,
        settlementDateTime: this.settlementDateTime,
        transactionId: this.transactionId,
        fromDate: this.fromDate,
        toDate: this.toDate
      }
    ).subscribe({

      next: (response: any) => {

        this.loading2 = false;

        if (response?.success) {

          this.common.alertmessage(
            'Delivery Boy Settlement Done',
            'Success',
            'success'
          );

          this.showDboySettlementPopup = false;

          this.selectedDeliveryBoyId = '';
          this.paymentMethod = '';
          this.transactionId = '';
          this.settlementDateTime = '';

          this.getOrders();

        }

      },

      error: (err) => {

        console.log(err);

        this.loading2 = false;

        this.common.alertmessage(
          'Something went wrong',
          'Error',
          'error'
        );

      }

    });

  }

  saveStoreSettlement() {

    if (!this.selectedStoreId) {
      this.common.alertmessage(
        'Please select store',
        'Warning',
        'warning'
      );
      return;
    }

    this.loading2 = true;

    this.http.post(
      this.api.baseUrl +
      '/order/settle-store-payments',
      {
        storeId: this.selectedStoreId,
        paymentMethod: this.paymentMethod,
        settlementDateTime: this.settlementDateTime,
        transactionId: this.transactionId,
        fromDate: this.fromDate,
        toDate: this.toDate,
        commissiontotakefromstore_percent:this.commissiontotakefromstore_percent 
      }
    ).subscribe({

      next: (response: any) => {

        this.loading2 = false;

        if (response?.success) {

          this.common.alertmessage(
            'Store Settlement Done',
            'Success',
            'success'
          );

          this.showStoreSettlementPopup = false;

          this.selectedStoreId = '';
          this.paymentMethod = '';
          this.transactionId = '';
          this.settlementDateTime = '';

          this.getOrders();

        }

      },

      error: (err) => {

        this.loading2 = false;

        this.common.alertmessage(
          'Something went wrong',
          'Error',
          'error'
        );

      }

    });

  }
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