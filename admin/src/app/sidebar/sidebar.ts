import { Component } from '@angular/core';
import { AuthService } from '../services/auth';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../services/api';

import { Common } from '../services/common';
@Component({
  selector: 'app-sidebar',
  imports: [CommonModule,
    RouterModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  isCollapsed = true;
  userType: string | null = null;
  adminemail: string | null = null;
  store: any = undefined;
  isLoading = false;
  constructor(private api: ApiService, public auth: AuthService, public common: Common) {
    if (!this.auth.isloggedIn()) {
      // Redirect to login if not logged in
      window.location.href = '/login';
    }
    else {
      let session = this.auth.getSession();
      this.userType = session.userType;
      this.adminemail = session.user.email;
      if (session.userType !== 'store' && session.userType !== 'admin') {
        // Redirect to login if not admin
        window.location.href = '/login';
      }

      if (session.userType == 'store' && !session.storeId) {
        // Redirect to login if not admin
        window.location.href = '/select-store';
      } else if (session.userType == 'store' && session.storeId) {
        this.getStoreDetails(session.storeId);
      }


    }
  }
  getStoreDetails(storeId: any) {
    this.isLoading = true;
    this.api.getStoreDetail(storeId).subscribe((res: any) => {
      this.isLoading = false;
      if (res.success) {
        this.store = res.data;
      } else {
        this.common.alertmessage('Failed to fetch store details', 'Error', 'error');
      }
    })
  }
  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
  }
   
  logout() {
    this.auth.logout();
    window.location.href = '/login';
  }
  changeStatus(id: any, status: any, col: any) {
    this.isLoading = true;
    this.api.updateStoreStatus(id, status, col)
      .subscribe((res: any) => {
        this.isLoading = false;
        if (res.success === true) {
          this.common.alertmessage('Store status updated successfully', 'Success', 'success');
          this.store[col] = status;
        }
        else {
          this.common.alertmessage('Failed to update store status', 'Error', 'error');
        }

      }, err => {
        this.isLoading = false;
        this.common.alertmessage('Failed to update store status', 'Error', 'error');
        console.error("Error updating store status:", err);
      });

  }
}
