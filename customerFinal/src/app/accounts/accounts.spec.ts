



import {
  Component,
  OnInit
} from '@angular/core';
import { Footer } from '../footer/footer';
import { Subheader } from '../subheader/subheader';
import {
  CommonModule
} from '@angular/common';

import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  Validators
} from '@angular/forms';

import {
  Router,
  RouterModule
} from '@angular/router';

import {
  HttpClient
} from '@angular/common/http';


import { Common } from '../services/common';
import { AuthService } from '../services/auth';
import { ApiService } from '../services/api';
import { WishlistService } from '../services/wishlist';
import { PopupService } from '../services/popup';
import { Addressreminder } from '../addressreminder/addressreminder';

@Component({
  selector: 'app-accounts',
  standalone: true,
  templateUrl: './accounts.html',
  styleUrls: ['./accounts.css'],
  imports: [
    CommonModule, Footer, Subheader, Addressreminder,
    FormsModule,
    RouterModule,
    ReactiveFormsModule
  ]
})

export class Accounts implements OnInit {
  userdetails: any = {};
  constructor(

    public common: Common,

    private auth: AuthService,

    private api: ApiService,

    private http: HttpClient,

    public popupService: PopupService,

    private wishlistService: WishlistService,

    private fb: FormBuilder,

    private router: Router

  ) { }
  ngOnInit(): void {
    this.userdetails = this.auth.getSession().user;
  }
  openaddressaddselect() {
    this.popupService.open(
      'addressaddselect',
      'accounts'
    );
  }
  openwallet() {
    this.popupService.open(
      'wallet',
      '-1'
    );
  }

  opencustomorder() {
    this.popupService.open(
      'customorderlist',
      '-1'
    );
  }
  async logout() {

    const confirmed =
      await this.common.confirmopen(
        "Are you sure you want to logout ?"
      );

    if (confirmed) {

      this.auth.logoutredirect();

    }

  }



}