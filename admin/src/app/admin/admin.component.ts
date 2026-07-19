
import { Component, OnInit } from '@angular/core';

import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ApiService } from '../services/api';
import { AuthService } from '../services/auth';
import { Common } from '../services/common';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css'],
  imports: [CommonModule, ReactiveFormsModule, RouterModule, FormsModule],

})

export class AdminComponent {
  constructor(private CommonService: ApiService, public common: Common,
    private auth: AuthService,
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.auth.isloggedIn() || this.router.navigate(['/login']);
    let session = this.auth.getSession();
    session.userType === 'admin' || session.userType === 'store' || this.router.navigate(['/login']);


  }
  ngOnInit() {

  }

  userlist: any = [];
  channelList: any = [];
  chatlist: any = [];
  emptydb(table: any) {
    if (!confirm("Are you sure you want to empty the database? This action cannot be undone!")) {
      return
    }
    this.CommonService.emptydb(table).subscribe((res: any) => {
      if (res.status == "success") {
        alert(table + "Database emptied successfully!");
      } else {
        alert("Failed to empty the database "+table);
      }
    }, (error: any) => {
      console.error("Error emptying database:", error);
      alert("An error occurred while emptying the database.");
    });
  }

}
