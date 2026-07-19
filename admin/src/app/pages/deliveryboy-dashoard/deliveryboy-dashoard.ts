 


import { Component } from '@angular/core';
import { AuthService } from '../../services/auth';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api';

import { Common } from '../../services/common';
@Component({
  selector: 'app-deliveryboy-dashoard',
  imports: [RouterModule, CommonModule],
  templateUrl: './deliveryboy-dashoard.html',
  styleUrl: './deliveryboy-dashoard.css',
})
export class DeliveryboyDashboard {
  constructor(private api: ApiService, public auth: AuthService, public common: Common) {

  }
}
