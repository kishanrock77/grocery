import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { environment } from '../../environments/environment';
import { AuthService } from './auth';
import { FcmService } from './fcm';
import { Common } from './common';

@Injectable({
  providedIn: 'root'
})

export class PopupService {


  // 🔥 STACK
  stack: any[] = [];

  // 🔥 OBSERVABLE
  private popupData =
    new BehaviorSubject<any[]>([]);

  popupData$ =
    this.popupData.asObservable();

  constructor(private auth: AuthService, private fcm: FcmService, public common: Common,) {


    if (!localStorage.getItem('userId')) {
      // this.auth.logoutredirect();
    }

  }


  isCloudFrontLocation(): boolean {
    return window.location.href.startsWith('https://d18rqizqqnw39g.cloudfront.net');
  }


  // ====================================
  // OPEN
  // ====================================

  open(
    component: string,
    data?: any, force = ''
  ) {

    // =========================
    // BROWSER MODE
    // =========================   
    if (this.common.browserorapp == undefined) {
      if (localStorage.getItem('browserorapp') == null || !localStorage.getItem('browserorapp') || localStorage.getItem('browserorapp') == '') {
        this.common.browserorapp = 'app';
        localStorage.setItem('browserorapp', 'app');
      }
      this.common.browserorapp = localStorage.getItem('browserorapp');
    }
    if (this.isCloudFrontLocation()  ) {

      window.open(
        '/' + component + '/' + data,
        '_blank'
      );

      return;
      }

    // =========================
    // APP POPUP MODE
    // =========================

    // 🔥 PUSH NEW PAGE
    this.stack.push({

      component,
      data

    });

    // 🔥 UI UPDATE
    this.popupData.next([
      ...this.stack
    ]);

    // 🔥 IMPORTANT
    // ADD HISTORY STATE
    history.pushState(

      {

        popup: true,
        level: this.stack.length

      },

      ''

    );

    // 🔥 SCROLL TOP
    setTimeout(() => {

      document
        .querySelector('.popup-page:last-child')
        ?.scrollTo({

          top: 0,
          behavior: 'instant' as ScrollBehavior

        });

    }, 0);
    this.fcm.callme(localStorage.getItem('userId'), 'customer');
  }

  // ====================================
  // CLOSE
  // ====================================

  close(
    triggerBack = true
  ) {

    // NOTHING OPEN
    if (!this.stack.length)
      return;

    // 🔥 REMOVE LAST
    this.stack.pop();

    // 🔥 UPDATE UI
    this.popupData.next([
      ...this.stack
    ]);

    // 🔥 REAL BACK
    // only when user clicked close btn
    if (triggerBack) {

      //  history.back();

    }

  }

  // ====================================
  // CURRENT POPUP
  // ====================================

  getCurrentPopup() {

    if (!this.stack.length)
      return null;

    return this.stack[
      this.stack.length - 1
    ];

  }

  // ====================================
  // CLEAR ALL
  // ====================================

  clear() {

    this.stack = [];

    this.popupData.next([]);

  }

}