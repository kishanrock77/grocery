import { Component, HostListener, OnInit } from '@angular/core';
import { AuthService } from '../services/auth';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../services/api';
import { Common } from '../services/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Subject } from 'rxjs/internal/Subject';

@Component({
  selector: 'app-customerlist',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule
  ],
  templateUrl: './customerlist.html',
  styleUrl: './customerlist.css'
})
export class Customerlist implements OnInit {

  customers: any[] = [];

  page = 1;
  limit = 10;

  loading = false;
  hasMore = true;

  search = '';

  adminemail = '';
  currentUserId = '';
searchSubject = new Subject<string>();
  constructor(
    private api: ApiService,
    public auth: AuthService
  ) { }

  ngOnInit() {
 this.searchSubject
    .pipe(
      debounceTime(500),
      distinctUntilChanged()
    )
    .subscribe(() => {
      this.loadCustomers(true);
    });
    this.currentUserId =
      localStorage.getItem('adminId') || '';

    let session =
      this.auth.getSession();

    this.adminemail =
      session.user.email;

    this.loadCustomers();
  }

  onSearchChange() {
  this.searchSubject.next(this.search);
}
  loadCustomers(reset = false) {

    if (this.loading) return;

    this.loading = true;

    if (reset) {
      this.page = 1;
      this.customers = [];
      this.hasMore = true;
    }

    this.api
      .loadCustomers(
        
        {
          page: this.page,
          limit: this.limit,
          search: this.search,
          adminId: this.currentUserId,
          adminemail: this.adminemail
        }
      )
      .subscribe((res: any) => {

        this.customers = [
          ...this.customers,
          ...res.customers.map((x: any) => ({
            ...x,
            expanded: false
          }))
        ];

        if (
          res.customers.length <
          this.limit
        ) {
          this.hasMore = false;
        }

        this.page++;

        this.loading = false;
      });
  }

  searchCustomer() {
    this.loadCustomers(true);
  }

  toggle(customer: any) {
    customer.expanded =
      !customer.expanded;
  }

  @HostListener('window:scroll', [])
  onScroll() {

    if (
      window.innerHeight +
      window.scrollY >=
      document.body.offsetHeight - 300
    ) {

      if (
        this.hasMore &&
        !this.loading
      ) {
        this.loadCustomers();
      }
    }
  }

  openOrders(customerId: string) {

    window.open(
      `/customerorder/${customerId}`,
      '_blank'
    );

  }
}