import {
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';

import { Subheader } from '../subheader/subheader';

import { Subscription } from 'rxjs';


import { Common } from '../services/common'; console.log('5', 'orderlist');

import { AuthService } from '../services/auth'; console.log('6', 'orderlist');

import { ApiService } from '../services/api'; console.log('7', 'orderlist');

import { PopupService } from '../services/popup';
import { AnyOfSchema } from 'firebase/ai';


@Component({
  selector: 'app-deliveryboytrack',
  imports: [CommonModule, 
      RouterModule,
    Subheader],
  templateUrl: './deliveryboytrack.html',
  styleUrl: './deliveryboytrack.css',
})
export class Deliveryboytrack {
  @Input() boyIdandtypeFrompopdata: string = '';

  constructor(

    public common: Common,

    private api: ApiService,
    private sanitizer: DomSanitizer,


    private http: HttpClient,

    private router: Router,

    private route: ActivatedRoute,
    public popupService: PopupService

  ) { }
  boyid: string = '';
  userType: string = '';
  loading = true;
  mapUrl!: SafeResourceUrl;

  remainingSeconds = 0;
  remainingMinutes = 5;

  refreshInterval: any;
  countdownInterval: any;
  ngOnInit() {

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });


    console.log("com ehere order details", this.boyIdandtypeFrompopdata);
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
        this.boyIdandtypeFrompopdata.split('_').length == 2 && (this.boyid = this.boyIdandtypeFrompopdata.split('_')[0]) && (this.userType = this.boyIdandtypeFrompopdata.split('_')[1])
 this.getboyDetails();
    this.route.params.subscribe((params: any) => {
      if (params.id && params.ordertype) {
        this.boyid = params.id;

        this.userType = params.userType;
      } else {
        this.boyIdandtypeFrompopdata.split('_').length == 2 && (this.boyid = this.boyIdandtypeFrompopdata.split('_')[0]) && (this.userType = this.boyIdandtypeFrompopdata.split('_')[1])
      }


      this.getboyDetails();

    });
    this.startAutoRefresh();


  }
  startAutoRefresh() {

    this.remainingSeconds = 300;

    this.countdownInterval = setInterval(() => {

      this.remainingSeconds--;

      this.remainingMinutes = Math.floor(
        this.remainingSeconds / 60
      );

      if (this.remainingSeconds <= 0) {
        this.remainingSeconds = 300;
      }

    }, 1000);

    this.refreshInterval = setInterval(() => {

      this.getboyDetails();

    }, 300000); // 5 minutes

  }
  ngOnDestroy() {

    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }

    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }

  }
  refresh() {

    this.getboyDetails();

    this.remainingSeconds = 300;
  }
  boydoata: any;
  getboyDetails() {
console.log("333");
    try {

      this.loading = true;

      this.api.getboyDetails(this.boyid

      ).subscribe((response: any) => {

       
          this.boydoata = response;

          if (
            response.location?.coordinates &&
            response.location.coordinates.length === 2
          ) {
            const lng = response.location.coordinates[0];
            const lat = response.location.coordinates[1];

            this.mapUrl =
              this.sanitizer.bypassSecurityTrustResourceUrl(
                `https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed`
              );
          }


        
        this.loading = false;
      }, err => {
        this.loading = false;
        console.error('Error fetching boy details:', err);
      });

    } catch (error) {

      console.error('Error fetching boy details:', error);
      this.loading = false;

    }


  }

  goBack() {

    this.popupService.close();

  }
}
