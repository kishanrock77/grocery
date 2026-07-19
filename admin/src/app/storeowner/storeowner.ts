import { Component } from '@angular/core';
import { ApiService } from '../services/api';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { CommonModule } from '@angular/common';
import { Common } from '../services/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-store-owner',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './storeowner.html',
  styleUrl: './storeowner.css',
})
export class StoreOwnerComponent {
showadd= false;
  form: any = { name: '', password:"",mobile: '', email: '', addedBy: '' };
  list: any[] = [];
  editId: any = null;
  loading = false;
  submitted = false;

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private router: Router,
    public common: Common
  ) { }

  ngOnInit() {

    this.auth.isloggedIn() || this.router.navigate(['/login']);
    let session = this.auth.getSession();
    session.userType === 'admin' || this.router.navigate(['/login']);
    this.form = { name: '',password:"", mobile: '', email: '', addedBy: this.auth.getAdminId() };
    this.getList();
  }

  // ✅ LIST
  getList() {
    this.loading = true;

    this.api.storeownerlist(this.auth.getAdminId()).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.list = res.data || [];   // 🔥 FIX
      },
      error: () => {
        this.loading = false;
        this.common.alertmessage('List load failed', 'Error', 'error');
      }
    });
  }

  // ✅ SAVE (ADD + UPDATE)
  save(f: any) {
    this.submitted = true;

    if (f.invalid) return;

    this.loading = true;

    const apiCall = this.editId
      ? this.api.storeownerupdate(this.editId, this.form)
      : this.api.storeowneradd({ ...this.form, addedBy: this.auth.getAdminId() });

    apiCall.subscribe({
      next: (res: any) => {
        this.loading = false;

        if (res.success) {
          this.common.alertmessage(
            this.editId ? 'Updated Successfully' : 'Added Successfully',
            'Success',
            'success'
          );
          this.reset(f);
        } else {
          this.common.alertmessage(res.message || 'Failed', 'Error', 'error');
        }
      },
      error: () => {
        this.loading = false;
        this.common.alertmessage('Server Error', 'Error', 'error');
      }
    });
  }

  // ✅ EDIT
  edit(item: any) {
    this.form = { ...item };
    this.editId = item._id;
  }

  // ✅ DELETE
  delete(id: any) {
    if (!confirm('Are you sure. If you delete Store owner, Store under thisowner will also be deleted ?')) return;

    this.loading = true;

    this.api.storeownerdelete(id).subscribe({
      next: (res: any) => {
        this.loading = false;

        if (res.success) {
          this.common.alertmessage('Deleted', 'Success', 'success');
          this.getList();
        }
      },
      error: () => {
        this.loading = false;
        this.common.alertmessage('Server Error', 'Error', 'error');
      }
    });
  }

  // ✅ RESET
  reset(f: any) {
    this.form = { name: '',password:"", mobile: '', email: '', addedBy: this.auth.getAdminId() };
    this.editId = null;
    this.submitted = false;
    f.resetForm();
    this.getList();
  }
}