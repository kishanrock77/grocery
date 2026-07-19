 
import {
  Component,
  OnInit,
  OnDestroy
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { AuthService } from '../services/auth';
import { Common } from '../services/common';
import { ApiService } from '../services/api';

@Component({
  selector: 'app-sidebar-delivery',
  imports: [
    CommonModule,
    RouterModule
  ],
  templateUrl: './sidebar-delivery.html',
  styleUrl: './sidebar-delivery.css',
})
export class SidebarDelivery implements OnInit, OnDestroy {

  isCollapsed = true;
  currentUser: any;
  isLoading = false;

  locationInterval: any;

  constructor(
    private api: ApiService,
    private auth: AuthService,
    public common: Common
  ) {

    if (!this.auth.isloggedIn()) {
      window.location.href = '/login';
      return;
    }

    const session = this.auth.getSession();

    if (session?.userType !== 'deliveryboy') {
      window.location.href = '/login';
      return;
    }

    this.currentUser = session?.user;
  }

  ngOnInit(): void {

    // Initial location update
    this.updateCurrentLocation();

    // Auto update every 5 minutes
    this.locationInterval = setInterval(() => {
      this.updateCurrentLocation();
    }, 300000);

  }

  ngOnDestroy(): void {

    if (this.locationInterval) {
      clearInterval(this.locationInterval);
    }

  }

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
  }

  logout() {
    this.auth.logout();
    window.location.href = '/login';
  }

  changeStatus(id: any, status: any, col: any) {

    this.isLoading = true;

    this.api.updateDStatus(id, status, col)
      .subscribe({

        next: (res: any) => {

          this.isLoading = false;

          if (res.success) {

            this.common.alertmessage(
              'Status updated successfully',
              'Success',
              'success'
            );

            this.currentUser[col] = status;

          } else {

            this.common.alertmessage(
              'Failed to update status',
              'Error',
              'error'
            );

          }

        },

        error: (err) => {

          this.isLoading = false;

          this.common.alertmessage(
            'Failed to update status',
            'Error',
            'error'
          );

          console.error(err);

        }

      });

  }

  updateCurrentLocation() {

    if (!navigator.geolocation) {
      console.log('Geolocation not supported');
      return;
    }

    navigator.geolocation.getCurrentPosition(

      (position) => {

        const payload = {
          boyid: this.currentUser?._id,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };

        this.api.updateDLocation(payload)
          .subscribe({

            next: (res: any) => {
              console.log(
                'Location updated:',
                payload.latitude,
                payload.longitude
              );
            },

            error: (err) => {
              console.error(
                'Location update failed:',
                err
              );
            }

          });

      },

      (error) => {
        console.error(
          'Unable to get location:',
          error
        );
      },

      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }

    );

  }

}
 
