import { Component } from '@angular/core';
import { ApiService } from '../services/api';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth';
import { CommonModule } from '@angular/common';
import { Common } from '../services/common';

@Component({
  selector: 'app-storelist',
  imports: [CommonModule, RouterModule],
  templateUrl: './storelist.html',
  styleUrl: './storelist.css',
})
export class Storelist {
  stores: any[] = [];
  isLoading = true;
  constructor(private api: ApiService, public common: Common, private auth: AuthService, private router: Router) {

  }
  ngOnInit() {

    this.auth.isloggedIn() || this.router.navigate(['/login']);
    let session = this.auth.getSession();
    session.userType === 'admin' || this.router.navigate(['/login']);
    this.getStores();
  }
  currentImageIndex: any = {};
  nextImage(store: any) {

    const id = store._id

    if (!this.currentImageIndex[id]) {
      this.currentImageIndex[id] = 0
    }

    if (this.currentImageIndex[id] < store.images.length - 1) {
      this.currentImageIndex[id]++
    } else {
      this.currentImageIndex[id] = 0
    }

  }
  prevImage(store: any) {

    const id = store._id;

    if (!this.currentImageIndex[id]) {
      this.currentImageIndex[id] = 0;
    }

    if (this.currentImageIndex[id] > 0) {
      this.currentImageIndex[id]--;
    } else {
      this.currentImageIndex[id] = store.images.length - 1;
    }

  }
  changeStatus(id: any, status: any, col: any) {
    this.isLoading = true;
    this.api.updateStoreStatus(id, status, col)
      .subscribe((res: any) => {
        this.isLoading = false;
        if (res.success === true) {
          this.common.alertmessage('Store status updated successfully', 'Success', 'success');
          let store = this.stores.find((s: any) => s._id == id);

          if (store) {
            store[col] = status;
          }
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
  getStores() {
    this.isLoading = true;
    const adminId = this.auth.getAdminId();

    this.api.getStores(adminId).subscribe((res: any) => {
      this.isLoading = false;
      this.stores = res.data;

    }, err => {
      this.isLoading = false;
      this.common.alertmessage('Failed to fetch store', 'Error', 'error');

      console.error("Error fetching stores:", err);
    });

  }

  toggleDetail(store: any) {

    store.showDetail = !store.showDetail;

  }

  editStore(id: any) {

    this.router.navigate(['/addstore', id]);

  }

  deleteStore(storeid: any) {

    if (confirm("Are you sure you want to delete this store?")) {
      this.isLoading = true;
      this.api.deleteStore(storeid).subscribe(() => {
         this.common.alertmessage('Store deleted successfully ', 'Error', 'error');

        this.getStores();

      }, err => {
        this.isLoading = false;
        this.common.alertmessage('Failed to delete store', 'Error', 'error');
        console.error("Error deleting store:", err);
      });

    }

  }
}
