


import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { AuthService } from '../services/auth';
import { Common } from '../services/common';
import { ApiService } from '../services/api';
import { PopupService } from '../services/popup';


@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  constructor(
    public auth: AuthService, private api: ApiService,
    private common: Common,public popupService: PopupService,
    private router: Router
  ) {


    this.auth.isloggedIn() || this.router.navigate(['/login']);
    const session = this.auth.getSession();
    if (!session?.selectedArea) {
      this.router.navigate(['/select-area/header']);
    } else {
      this.selectedArea = session.selectedArea;
    }
  } selectedArea: any;

  ngonInit() {

  }
  goToSelectArea() {
    this.router.navigate(['/select-area/header']);
  }
  goToAccount() {
    this.router.navigate(['/account']);
  }
}
