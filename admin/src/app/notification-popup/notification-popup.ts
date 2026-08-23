import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { NotificationService } from '../services/notification.service';

@Component({
  selector: 'app-notification-popup',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-popup.html',
  styleUrl: './notification-popup.css',
})
export class NotificationPopupComponent implements OnInit, OnDestroy {

  notification: any = null;

  private subscription?: Subscription;

  constructor(
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {

    console.log('NotificationPopupComponent INITIALIZED');

    this.subscription =
      this.notificationService.notificationPopup$
        .subscribe((data) => {

          console.log(
            'POPUP COMPONENT RECEIVED:',
            data
          );

          this.notification = data;

          if (data) {
            setTimeout(() => {
              this.notification = null;
            }, 10000);
          }

        });
  }

  closePopup(): void {

    this.notification = null;

    this.notificationService.closeNotificationPopup();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
