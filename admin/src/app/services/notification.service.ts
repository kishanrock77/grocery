import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {

  uri: string = environment.commonURL;

  private socket!: Socket;

  // ================= NOTIFICATIONS LIST =================

  private notifications = new BehaviorSubject<any[]>([]);
  notifications$ = this.notifications.asObservable();

  // ================= CUSTOM POPUP =================

  private notificationPopup =
    new BehaviorSubject<any | null>(null);

  notificationPopup$ =
    this.notificationPopup.asObservable();

  // ================= AUDIO =================

  private notificationAudio: HTMLAudioElement | null = null;

  constructor() {

    this.requestPermission();
    this.initSocket();

  }

  // ======================================================
  // SOCKET
  // ======================================================

  initSocket() {

    this.socket = io(this.uri);

    // ================= SOCKET CONNECT =================

    this.socket.on('connect', () => {

      console.log(
        'Socket Connected:',
        this.socket.id
      );

      const userId =
        localStorage.getItem('userId');

      console.log(
        'UserId:',
        userId
      );

      if (userId) {

        this.socket.emit(
          'registerUser',
          { userId }
        );

        console.log(
          'User Registered:',
          userId
        );

      }

    });

    // ==================================================
    // RECEIVE NOTIFICATION
    // ==================================================

    this.socket.on(
      'newNotification',
      async (data: any) => {

        console.log(
          'New Notification Received:',
          data
        );

        // ==================================================
        // 1. UPDATE NOTIFICATION LIST
        // ==================================================

        const current =
          this.notifications.value;

        this.notifications.next([
          data,
          ...current
        ]);

        // ==================================================
        // 2. SHOW CUSTOM WEBSITE POPUP
        // ==================================================

        this.showNotificationPopup(data);

        // ==================================================
        // 3. PLAY NOTIFICATION AUDIO
        // ==================================================

        try {

          this.notificationAudio =
            new Audio(
              'assets/notification.wav'
            );

          this.notificationAudio.loop = true;

          await this.notificationAudio
            .play()
            .catch((err) => {

              console.log(
                'Audio Play Error:',
                err
              );

            });

        } catch (error) {

          console.log(
            'Audio Error:',
            error
          );

        }

        // ==================================================
        // 4. BROWSER NOTIFICATION
        // ==================================================

        try {

          if (
            !('serviceWorker' in navigator)
          ) {

            console.log(
              'Service Worker not supported'
            );

          } else {

            const registration =
              await navigator.serviceWorker.ready;

            const options: any = {

              body:
                data.message || '',

              icon:
                'assets/logo.png',

            };

            await registration.showNotification(

              data.title || 'FastBite',

              options

            );

            console.log(
              'Browser Notification Sent'
            );

          }

        } catch (error) {

          console.log(
            'Browser Notification Error:',
            error
          );

        }

        // ==================================================
        // 5. AUTO STOP AUDIO AFTER 15 SECONDS
        // ==================================================

        setTimeout(() => {

          this.stopHooter();

        }, 15000);

      }
    );

  }

  // ======================================================
  // SHOW CUSTOM POPUP
  // ======================================================

  showNotificationPopup(data: any) {

    const popupData = {

      title:
        data?.title || 'FastBite',

      message:
        data?.message || '',

    };

    console.log(
      'Showing Custom Notification Popup:',
      popupData
    );

    this.notificationPopup.next(
      popupData
    );

  }

  // ======================================================
  // CLOSE CUSTOM POPUP
  // ======================================================

  closeNotificationPopup() {

    this.notificationPopup.next(null);

  }

  // ======================================================
  // PERMISSION
  // ======================================================

  requestPermission() {

    if (!('Notification' in window)) {

      console.log(
        'Browser Notification Not Supported'
      );

      return;

    }

    Notification
      .requestPermission()
      .then((permission) => {

        console.log(
          'Notification Permission:',
          permission
        );

      })
      .catch((error) => {

        console.log(
          'Notification Permission Error:',
          error
        );

      });

  }

  // ======================================================
  // STOP AUDIO
  // ======================================================

  stopHooter() {

    if (this.notificationAudio) {

      this.notificationAudio.pause();

      this.notificationAudio.currentTime = 0;

      this.notificationAudio = null;

      console.log(
        'Notification Audio Stopped'
      );

    }

  }

  // ======================================================
  // TEST NOTIFICATION
  // ======================================================

  sendTestNotification(msg: string) {

    if (!this.socket) {

      console.log(
        'Socket is not initialized'
      );

      return;

    }

    this.socket.emit(
      'sendTest',
      msg
    );

  }

}
