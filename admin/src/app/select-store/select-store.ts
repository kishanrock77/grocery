
import { Component } from '@angular/core';
import { ApiService } from '../services/api';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { CommonModule } from '@angular/common';
import { Common } from '../services/common';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-select-store',
  imports: [CommonModule, FormsModule],
  templateUrl: './select-store.html',
  styleUrl: './select-store.css',
})
export class SelectStore {
  constructor(
    private api: ApiService,
    private auth: AuthService,
    private router: Router,
    public common: Common
  ) {
    this.auth.isloggedIn() || this.router.navigate(['/login']);
    let session = this.auth.getSession();
    session.userType === 'store' || this.router.navigate(['/login']);
    this.storeid = localStorage.getItem('storeId');

  }

  stores: any[] = [];
  isLoading: boolean = false;
  storeid: any;
  ngOnInit() {

    this.loadstoresforstoreowner();
  }
  loadstoresforstoreowner() {
    this.isLoading = true;

    const ownerId = this.auth.getSession().userId;
    this.api.loadstoresforstoreowner(ownerId).subscribe({
      next: (res: any) => {
        this.stores = res.data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.common.alertmessage('Failed to load stores', 'Error', 'error');
      }
    });
  }
  storeName = '';
  callme(store: any) {
    this.storeid = store._id;
    this.storeName = store.storeName;

  }
  selectStore() {
    if (!this.storeid) {
      this.common.alertmessage('Please select a store', 'Alert', 'warning');
      return;
    }
    localStorage.setItem('storeId', this.storeid);
    localStorage.setItem('storename', this.storeName);
    this.auth.storename = this.storeName;

    window.location.href = '/orders';
  }

}
