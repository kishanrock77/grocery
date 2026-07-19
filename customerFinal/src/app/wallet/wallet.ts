import { Component, OnInit,OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Subheader } from '../subheader/subheader';

import { ApiService } from '../services/api';
import { AuthService } from '../services/auth';
import { Common } from '../services/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-wallet',
  standalone: true,
  imports: [CommonModule, Subheader],
  templateUrl: './wallet.html',
  styleUrls: ['./wallet.css']
})
export class WalletComponent implements OnInit  , OnDestroy{

  walletList: any[] = [];

  balanceAmount = 0;

  loading = true;

  constructor(

    public common: Common,

    private auth: AuthService,

    private http: HttpClient,

    private api: ApiService,

    private router: Router

  ) { }

  ngOnInit() {

    this.loadWallet();

  }
  a?: Subscription;
  ngOnDestroy(): void {
      this.a?.unsubscribe();
      
  }
  loadWallet() {
    const customerId =
      this.auth.getSession()?.userId;
    this.loading = true;
    this.a?.unsubscribe();

    this.a = this.http.post(
      this.api.baseUrl + '/wallet/wallet-history',
      {
        customerId: customerId
      }
    ).subscribe((res: any) => {

      this.loading = false;

      if (res.success) {

        this.walletList = res.walletList || [];

        this.balanceAmount = res.balanceAmount || 0;

      }

    });

  }

  formatDate(date: any) {

    return new Date(date).toLocaleString(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }
    );

  }

}