// app.component.ts
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Sidebar } from "./sidebar/sidebar";
import { AuthService } from './services/auth';
import { SidebarDelivery } from "./sidebar-delivery/sidebar-delivery";
import { CommonModule } from '@angular/common';
import { Toaster } from './toaster/toaster';
import { FcmService } from './services/fcm';
import { Common } from './services/common';
import { NotificationPopupComponent } from './notification-popup/notification-popup';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule,NotificationPopupComponent ,Sidebar, SidebarDelivery, CommonModule, Toaster],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],

})
export class AppComponent {
  isloggedIn = false;
  userType: string | null = null; userId: string | null = null;
  storeId: string | null = null;
  constructor(private fcm: FcmService, private common: Common,
    public auth: AuthService) {

    if (this.auth.isloggedIn()) {
      this.isloggedIn = true;
      this.userType = this.auth.getSession().userType;
      this.userId = this.auth.getSession().userId;

      this.storeId = this.auth.getSession().storeId;
      console.log('User Type:', this.userType);
      console.log('Store ID:', this.storeId);
    } else {
      this.isloggedIn = false;

    }

  }
  ngOnInit() {
   
    document.addEventListener(
      'click',
      () => {

        const audio = new Audio('notification.wav');

        audio.play()
          .then(() => {
            audio.pause();
            audio.currentTime = 0;
            console.log('Audio unlocked');
          })
          .catch(err => {
            console.log('Audio unlock failed', err);
          });

      },
      { once: true }
    );

  }
}