import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Subheader } from '../subheader/subheader';

import { ApiService } from '../services/api';
import { AuthService } from '../services/auth';
import { Common } from '../services/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';



@Component({
  selector: 'app-profile',
  imports: [CommonModule, Subheader, FormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile {
  loading = true;

  constructor(

    public common: Common,

    private auth: AuthService,

    private http: HttpClient,

    private api: ApiService,

    private router: Router

  ) { }

  ngOnInit() {

    this.loadcustomerdetails();

  }
  user: any = {};
  loadcustomerdetails() {
    const customerId =
      this.auth.getSession()?.userId;
    this.loading = true;

    this.auth.getProfilebyid(customerId).subscribe((res: any) => {

      this.loading = false;

      if (res.success) {

        this.user = res.user;
        this.formobj = {
          mobile: this.user.mobile, name: this.user.name, dateofbirth: this.user.dateofbirth
            ? new Date(this.user.dateofbirth)
              .toISOString()
              .split('T')[0]
            : ''
        }


      }

    });
  }
  formobj: any = {};

  updateUser() {
    const customerId =
      this.auth.getSession()?.userId;
    this.loading = true;
    if (this.formobj.mobile?.length !== 10) {
      this.common.alertmessage('Please enter a valid 10-digit mobile number', 'error', 'error');
      this.loading = false;
      return;
    }
    if (!this.formobj.name) {
      this.common.alertmessage('Please enter your name', 'error', 'error');
      this.loading = false;
      return;
    }

    this.auth.updatUser({ ...this.formobj, customerId: customerId }).subscribe((res: any) => {

      this.loading = false;

      if (res.success) {

        this.user = res.customer;
        this.auth.saveSession(res.customer);
        this.common.alertmessage(res.message, 'success', 'success')


      }

    });
  }
}
