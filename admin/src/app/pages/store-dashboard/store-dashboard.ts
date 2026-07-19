 
import { Component } from '@angular/core';
import { AuthService } from '../../services/auth';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api';

import { Common } from '../../services/common';
import { AdminDashboard } from '../admin-dashoard/admin-dashoard';
@Component({
  selector: 'app-store-dashoard',
  imports: [RouterModule, CommonModule,AdminDashboard],
  templateUrl: './store-dashboard.html',
  styleUrl: './store-dashboard.css',
})
export class StoreDashboard {
  constructor(private api: ApiService, public auth: AuthService, public common: Common) {

  }
}
