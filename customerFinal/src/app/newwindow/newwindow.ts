import {
  Component,
  OnInit
} from '@angular/core';

import { CommonModule } from '@angular/common';

import { PopupService } from '../services/popup';

import { Storedetail } from '../storedetail/storedetail';
import { Productsoflvel2category } from '../productsoflvel2category/productsoflvel2category';
import { ItemDetails } from '../itemdetails/itemdetails';

import { Searchitem } from '../searchitem/searchitem';
import { Cartpage } from '../cartpage/cartpage';
import { ɵEmptyOutletComponent } from "@angular/router";
import { Address } from '../address/address';
import { Whishitems } from '../whishitems/whishitems';
import { Orderlist } from '../orderlist/orderlist';
import { Orderdetails } from '../orderdetails/orderdetails';
import { WalletComponent } from '../wallet/wallet';
import { Support } from '../support/support';
import { Deliveryboytrack } from '../deliveryboytrack/deliveryboytrack';
import { CustomOrderComponent } from '../custom-order/custom-order';
import { CustomOrderList } from '../custom-order-list/custom-order-list';


@Component({

  selector: 'app-newwindow',

  standalone: true,

  imports: [
    CommonModule,
    Storedetail, Support,
    Productsoflvel2category, Cartpage, Whishitems,
    ItemDetails, Searchitem, Orderdetails, Orderlist, WalletComponent,
    ɵEmptyOutletComponent, Address, Deliveryboytrack, CustomOrderComponent,CustomOrderList
  ],

  templateUrl: './newwindow.html',
  styleUrl: './newwindow.css'

})

export class Newwindow implements OnInit {

  constructor(
    public popupService: PopupService
  ) { }

  ngOnInit() {

    // 🔥 BACK BUTTON
    window.onpopstate = () => {

      if (this.popupService.stack.length > 0) {

        this.popupService.close(false);

      }

    };

  }

  trackByIndex(index: number) {

    return index;

  }

}