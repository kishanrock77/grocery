import { Component, Input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api';
import { AuthService } from '../services/auth';
import { Common } from '../services/common';
import { Subheader } from '../subheader/subheader';
import { PopupService } from '../services/popup';

@Component({
  selector: 'app-custom-order-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule, Subheader
  ],
  templateUrl: './custom-order-list.html',
  styleUrl: './custom-order-list.css',
})
export class CustomOrderList {
  @Input() data: any;

  customerId: any;

  constructor(private auth: AuthService,
    public common: Common,


    public popupService: PopupService,
    private route: ActivatedRoute,
    private api: ApiService,
    private router: Router
  ) {




    this.customerId =

      this.auth.getSession()?.userId;
    this.getcustomorderlist();

  }
  loader = false;

  list: any = [];
  filterType = 'all';
  addcustomeorder() {
    this.popupService.open(
      'customorder',
      '-1'
    );
  }
  toggleMedical(order: any) {
    order.showMedical = !order.showMedical;
  }
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
  get filteredList() {

    if (this.filterType === 'admin') {
      return this.list.filter(
        (x: any) => x.statusByAdmin === 'pending'
      );
    }

    if (this.filterType === 'customer') {
      return this.list.filter(
        (x: any) =>
          x.statusByAdmin !== 'pending' && x.statusByAdmin !== 'rejected' &&
          x.statusByCustomer === 'pending'
      );
    }

    return this.list;
  }
  openImage(url: string) {

    window.open(
      url,
      '_blank'
    );

  }
  checkitem(order: any) {
    if (order.finalitemid == 'pending') {
      this.createnewitem(order);

    } else {
      this.openitem(order.finalitemid);
    }
  }
  createnewitem(order: any) {
    this.loader = true;
    this.api.createnewitemwhencustomapprovecustoorder(order).subscribe((res: any) => {
      this.loader = false;
      if (res.success) {

        order.finalitemid = res.finalitemid;
        this.openitem(order.finalitemid);
      } else {
        this.common.alertmessage(



          'Something went wrong',

          'error',

          'error'

        );
      }


    }, (err: any) => {
      this.loader = false;
      this.common.alertmessage(



        'Something went wrong',

        'error',

        'error'

      );
    })
  }

  openitem(itemid: any) {
    this.popupService.open(
      'itemdetails',
      itemid
    );
  }

  actionbycustomer(order: any, action: any) {
    this.loader = true;
    this.api.actionbycustomerforcustomorder({ _id: order._id, action }).subscribe((res: any) => {
      this.loader = false;
      if (res.success) {
        order.statusByCustomer = action;
        order.finalitemid = 'pending';
        this.common.alertmessage(



          'Status updated to ' + action,

          'success',

          'success'

        );
      } else {
        this.common.alertmessage(



          'Something went wrong',

          'error',

          'error'

        );
      }


    }, (err: any) => {
      this.loader = false;
      this.common.alertmessage(



        'Something went wrong',

        'error',

        'error'

      );
    })
  }
  getcustomorderlist() {
    this.loader = true;
    this.api.customorderlist("-1", this.customerId, 'customer').subscribe((res: any) => {
      this.loader = false;
      if (res.success) {

        this.list = res.data;
        this.filteredList();
      } else {
        this.common.alertmessage(



          'Something went wrong',

          'error',

          'error'

        );
      }


    }, (err: any) => {
      this.loader = false;
      this.common.alertmessage(



        'Something went wrong',

        'error',

        'error'

      );
    })
  }

}
