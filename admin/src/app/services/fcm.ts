import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import {
  getMessaging,
  getToken,
  onMessage
} from 'firebase/messaging';
import { environment } from '../../environments/environment';
import { AuthService } from './auth';

@Injectable({
  providedIn: 'root'
})
export class FcmService {

  messaging: any;

  constructor( private auth: AuthService) {

    const app =
      initializeApp(
        environment.firebase
      );

    this.messaging =
      getMessaging(app);

  }

  async getToken() {

    try {

      const permission =
        await Notification.requestPermission();

      // alert(
      //   'Notification Permission = ' +
      //   permission
      // );

      if (
        permission !== 'granted'
      ) {

        // alert(
        //   'Notification permission denied'
        // );

        return null;

      }

      const token =
        await getToken(
          this.messaging,
          {
            vapidKey:
              environment.keypair
          }
        );

      // alert(
      //   'FCM Token Generated'
      // );

      console.log(
        'FCM TOKEN:',
        token
      );

      return token;

    }
    catch (err: any) {

      console.error(err);

      // alert(
      //   'FCM Error = ' +
      //   (err?.message || err)
      // );

      return null;

    }

  }

  listen() {

    onMessage(
      this.messaging,
      (payload: any) => {

        console.log(
          'Message received:',
          payload
        );

        // alert(
        //   'Foreground Notification Received'
        // );

        try {

          new Notification(
            payload?.notification?.title ||
            'FastBite',
            {
              body:
                payload?.notification?.body ||
                '',
              icon:
                '/logo.png'
            }
          );

        }
        catch (e) {

          console.log(
            'Notification Error',
            e
          );

        }

        try {

          const audio =
            new Audio(
              '/notification.wav'
            );

          audio.play()
            .catch(err => {

              console.log(
                'Audio Error',
                err
              );

            });

        }
        catch (e) {

          console.log(
            'Audio Exception',
            e
          );

        }

      }
    );

  }
 callme(userId: any,userType:any) {
    this .getToken().then(token => {

      console.log('FCM TOKEN:', token);

      if (!token) {

        console.log(
          'FCM token not available'
        );

        return;

      }

      this.auth.tokenupdtae(
        userType,
        userId,
        token
      ).subscribe({

        next: (res:any) => {

          console.log(
            'Token saved'
          );

        },

        error: (err:any) => {

          // this.common.alertmessage(
          //   err.error.msg || 'Token update failed',
          //   'Alert',
          //   'error'
          // );

        }

      });

    });

    this.listen();

    //
  }
}