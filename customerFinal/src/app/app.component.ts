// app.component.ts
import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';

import { AuthService } from './services/auth';

import { CommonModule } from '@angular/common';
import { Newwindow } from './newwindow/newwindow';
import { Toaster } from './toaster/toaster';
import { Common } from './services/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule, CommonModule, Newwindow, Toaster],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit, OnDestroy {

  isloggedIn = false;

  userType: string | null = null;
  storeId: string | null = null;


  // 4 click counter
  private clickCount = 0;
  private clickTimer: any;


  isMobilePortrait = true;


  constructor(
    public common: Common,
    public auth: AuthService
  ) {

    if (this.auth.isloggedIn()) {
      this.isloggedIn = true;
    } else {
      this.isloggedIn = false;
    }

  }


  ngOnInit() {

    this.checkDevice();

    window.addEventListener(
      'resize',
      this.checkDevice
    );

    window.addEventListener(
      'orientationchange',
      this.checkDevice
    );
    if (localStorage.getItem('browserorapp') == 'browser') {

      // 4 tap/click detect
      document.addEventListener(
        'click',
        this.handleMultiClick
      );
    }

  }



  handleMultiClick = () => {

    if (localStorage.getItem('browserorapp') == 'app') {
      return;
    }


    this.clickCount++;


    // agar 3 click karke ruk gaya
    // to 1.5 second baad reset
    clearTimeout(this.clickTimer);


    this.clickTimer = setTimeout(() => {

      this.clickCount = 0;

    }, 1500);



    // 4 click complete
    if (this.clickCount >= 4) {


      const url = window.location.href;


      navigator.clipboard.writeText(url)
        .then(() => {

          if (localStorage.getItem('browserorapp') == 'browser') {
         //   this.common.alertmessage('URL copied', 'info', 'info');
          }

        })
        .catch(() => {
          if (localStorage.getItem('browserorapp') == 'browser') {
           // this.common.alertmessage('URL copy failed', 'error', 'error');
          }

        });



      // copy hone ke baad reset
      this.clickCount = 0;


      clearTimeout(this.clickTimer);

    }

  }




  checkDevice = () => {

    const width = window.innerWidth;

    const height = window.innerHeight;


    const isMobile = width <= 900;


    const isPortrait = height >= width;


    this.isMobilePortrait =
      isMobile && isPortrait;

  }




  ngOnDestroy() {


    window.removeEventListener(
      'resize',
      this.checkDevice
    );


    window.removeEventListener(
      'orientationchange',
      this.checkDevice
    );

    if (localStorage.getItem('browserorapp') == 'browser') {
      document.removeEventListener(
        'click',
        this.handleMultiClick
      );


      clearTimeout(this.clickTimer);
    }

  }

}