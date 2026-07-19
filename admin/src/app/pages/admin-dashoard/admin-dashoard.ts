import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api';
import { Common } from '../../services/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-admin-dashoard',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './admin-dashoard.html',
  styleUrl: './admin-dashoard.css',
})
export class AdminDashboard implements OnInit {

  loading = false;

  dashboard: any = {};

  sections = ['overall',
    'today',
    'yesterday',
    'currentWeek',
    'lastWeek',
    'last7Days',
    'currentMonth',
    'lastMonth',
    'last30Days',

  ];

  labels: any = {
    overall: 'Overall',
    today: 'Today',
    yesterday: 'Yesterday',
    currentWeek: 'Current Week',
    lastWeek: 'Last Week',
    last7Days: 'Last 7 Days',
    currentMonth: 'Current Month',
    lastMonth: 'Last Month',
    last30Days: 'Last 30 Days',

  };
adminemail:any='';
  constructor(
    private http: HttpClient,
    private api: ApiService,
    public auth: AuthService,
    public common: Common
  ) { 

 let session = this.auth.getSession();
      
      this.adminemail = session.user.email;

  }

  ngOnInit() {

    this.getDashboard();
  }
  usertype: any = '';
  getDashboard() {

    this.loading = true;

    const session = this.auth.getSession();

    const usertype = session?.userType;

    let userId = '';
    let storeId = '-1';
    this.usertype = usertype;
    if (usertype === 'admin') {
      userId = localStorage.getItem('adminId') || '';
    }

    if (usertype === 'store') {
      userId = localStorage.getItem('userId') || '';
      storeId = localStorage.getItem('storeId') || '';
    }

    this.http.get(
      `${this.api.baseUrl}/order/dashboard/${usertype}/${userId}/${storeId}`
    ).subscribe({
      next: (res: any) => {

        this.dashboard = res;
        this.toggleSection('overall')
        this.toggleSection('today')
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });

  }
  toggleSection(key: string) {

    if (!this.dashboard[key]) {
      this.dashboard[key] = {};
    }

    this.dashboard[key].open =
      !this.dashboard[key].open;

  }
}