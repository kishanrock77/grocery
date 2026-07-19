import { Component } from '@angular/core';
import { ApiService } from '../services/api';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth';
import { CommonModule } from '@angular/common';
import { Common } from '../services/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-itemlist',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './itemlist.html',
  styleUrl: './itemlist.css',
})
export class Itemlist {
  constructor(
    private api: ApiService,
    public common: Common,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.auth.isloggedIn() || this.router.navigate(['/login']);
    let session = this.auth.getSession();
    (session.userType === 'admin' || session.userType === 'store') ||
      this.router.navigate(['/login']);

       if (session.userType == 'store' && !session.storeId  ) {
        
        window.location.href = '/select-store';
      }
  }
  view: any = 'full'; // or 'grid'
  session: any;
  items: any[] = [];
  storeList: any[] = [];
  categoryList: any[] = [];

  isLoading: boolean = false;
  page: number = 1;
  limit: number = 10;
  hasMore: boolean = true;

  filters: any = {
    storeId: '-1',
    categoryId: '',
    itemName: '',
    showahat: 'GI' // GI = General Items, SI = Store Items, variant = Have Variants
  };

  ngOnInit() {
    this.session = this.auth.getSession();
    this.loadInitialData();
  }
  deleteItemAll() {
    if (!confirm('Are you sure you want to delete all items?')) return;
    this.api.deleteItemAll().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.common.alertmessage(
            'All items deleted successfully!',
            'Success',
            'success'
          );
          this.loadItems(true);
        }
      }
    });

  }
  // ==============================
  // Load Initial Data
  // ==============================
  loadInitialData() {
    if (this.session.userType === 'admin') {
      this.loadStores();
    } else {
      this.filters.storeId = localStorage.getItem('storeId');
    }

    this.loadCategories();
    this.loadItems(true);
  }
  // Add Item
  openAddItem() {
    window.open('/additem', '_blank');
  }

  // Edit Item
  openEdit(id: string) {
    window.open(`/additem/${id}`, '_blank');
  }
  // ==============================
  // Load Items (Server Side)
  // ==============================
  loadItems(reset: boolean = false) {
    if (reset) {
      this.page = 1;
      this.items = [];
      this.hasMore = true;
    }

    if (!this.hasMore) return;

    this.isLoading = true;

    const payload = {
      page: this.page,
      limit: this.limit,
      addedByString:
        this.session.userType === 'admin' ? 'admin' : 'store',
      loginId:
        this.session.userType === 'admin'
          ? this.session.adminId
          : this.session.userId,
      storeId: this.filters.storeId,
      categoryId: this.filters.categoryId,
      itemName: this.filters.itemName
    };

    this.api.getItemList(payload).subscribe({
      next: (res: any) => {
        this.isLoading = false;

        if (res.success) {
          this.items = [...this.items, ...res.data];
          this.hasMore = res.data.length === this.limit;
          this.page++;
        }
      },
      error: () => {
        this.isLoading = false;
        this.common.alertmessage(
          'Something went wrong!',
          'Error',
          'error'
        );
      }
    });
  }

  // ==============================
  // Load Stores (Admin Only)
  // ==============================
  loadStores() {
    this.api.getStores(this.session.adminId).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.storeList = res.data;
        }
      }
    });
  }

  // ==============================
  // Load Categories
  // ==============================
  loadCategories() {
    this.api.loadCategories(this.session.adminId).subscribe({
      next: (res: any) => {
        if (res) {
          this.categoryList = res.filter(
            (x: any) => x.level_no === 3
          );
        }
      }
    });
  }

  // ==============================
  // Search
  // ==============================
  search() {
    this.loadItems(true);
  }

  // ==============================
  // Infinite Scroll
  // ==============================
  onScroll() {
    if (
      window.innerHeight + window.scrollY >=
      document.body.offsetHeight - 100 &&
      !this.isLoading
    ) {
      this.loadItems();
    }
  }

  // ==============================
  // Edit Item
  // ==============================
  editItem(id: string) {
    this.router.navigate(['/add-item', id]);
  }

  // ==============================
  // Delete Item (Soft Delete)
  // ==============================
  deleteItem(item: any) {
    if (item.parentId?.length > 0) {
      this.common.alertmessage(
        'This item cannot be deleted as it has   parent items! First delete the parent items.',
        'Error',
        'error'
      );
      return;
    }
    // if (item.variantItems?.length > 0) {
    //   this.common.alertmessage(
    //     'This item cannot be deleted as it has variants   items! First remove the variant items.',
    //     'Error',
    //     'error'
    //   );
    //   return;
    // }
    if (!confirm('Are you sure you want to delete this item?')) return;

    this.api.deleteItem(item._id).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.common.alertmessage(
            'Item deleted successfully!',
            'Success',
            'success'
          );
          this.loadItems(true);
        }
      },
      error: () => {
        this.common.alertmessage(
          'Delete failed!',
          'Error',
          'error'
        );
      }
    });
  }
  showdetails(item: any) {
    window.open(this.common.appwaliwebsite + `/itemdetails/${item._id}`, '_blank');
  }
   updateShowOnFront(item: any, status: boolean): void {
    this.isLoading = true;

    const payload = {
      itemId: item._id,
      showOnFront: status
    };

    this.api.updateShowOnFront(payload).subscribe({
      next: (res: any) => {
        if (res.success) {
          item.showOnFront = status;
        }
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Error updating status:', err);
        this.isLoading = false;
      }
    });
  }
}