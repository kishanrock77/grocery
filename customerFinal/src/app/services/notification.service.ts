import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';
import { Common } from './common';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {

  websuburi: string = environment.websuburi;
  weburi: string = environment.weburi;
  uri: string = environment.commonURL;

  private socket!: Socket;

  private notifications =
    new BehaviorSubject<any[]>([]);

  notifications$ =
    this.notifications.asObservable();

  constructor(
    private common: Common) {

    this.initSocket();

  }

  // ============================
  // SOCKET INIT
  // ============================

  initSocket(userIdparam = null) {

    this.socket = io(this.uri);

    this.socket.on('connect', () => {

      console.log(
        'Socket connected:',
        this.socket.id
      );
      let userId;;
      if (userIdparam == null) {
        userId =
          localStorage.getItem(
            'userId'
          );
      } else {
        userId = userIdparam;
      }


      if (userId) {

        this.socket.emit(
          'registerUser',
          {
            userId
          }
        );

        console.log(
          'Socket room joined:',
          userId
        );

      }

    });

    // ============================
    // RECEIVE NOTIFICATION
    // ============================

    this.socket.on(
      'newNotification',
      (data: any) => {

        console.log(
          'New Notification:',
          data
        );
        this.common.alertmessage(data.title + ': ' + data.message, 'info', 'info');

        const current =
          this.notifications.value;

        this.notifications.next([
          data,
          ...current
        ]);

        // sound
        this.playSound();

        // browser popup

        if (
          'Notification' in window &&
          Notification.permission ===
          'granted'
        ) {

          new Notification(
            data.title,
            {
              body:
                data.message,
              icon:
                'logo.png'
            }
          );

        }

      }
    );

    this.socket.on(
      'otp',
      (data: any) => {
        console.log(
          'New OTP:',
          data
        );
        this.common.alertmessage(data.title + ': ' + data.message, 'info', 'info');

        const current =
          this.notifications.value;

        this.notifications.next([
          data,
          ...current
        ]);

        // sound
        this.playSound();

        // browser popup

        if (
          'Notification' in window &&
          Notification.permission ===
          'granted'
        ) {

          new Notification(
            data.title,
            {
              body:
                data.message,
              icon:
                'logo.png'
            }
          );

        }

      }
    );

    // ============================
    // DISCONNECT
    // ============================

    this.socket.on(
      'disconnect',
      () => {

        console.log(
          'Socket disconnected'
        );

      }
    );

  }

  // ============================
  // REQUEST PERMISSION
  // ============================

  requestPermission() {

    if (
      'Notification' in window
    ) {

      Notification
        .requestPermission()
        .then(permission => {

          console.log(
            'Notification permission:',
            permission
          );

        });

    }

  }

  // ============================
  // PLAY SOUND
  // ============================

  playSound() {

    try {

      const audio =
        new Audio(
          'notification.wav'
        );

      audio.load();

      audio.play().catch(
        err =>
          console.log(
            'Audio blocked:',
            err
          )
      );

    }
    catch (err) {

      console.log(
        'Audio error:',
        err
      );

    }

  }

  // ============================
  // TEST
  // ============================

  sendTestNotification(
    msg: string
  ) {

    this.socket.emit(
      'sendTest',
      msg
    );

  }

}