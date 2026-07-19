import { Injectable } from '@angular/core';
import {
  PushNotifications,
  Token,
  PushNotificationSchema,
  ActionPerformed
} from '@capacitor/push-notifications';

import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { LocalNotifications } from '@capacitor/local-notifications';
@Injectable({
  providedIn: 'root'
})
export class FcmService {

  uri: string = environment.commonURL;

  constructor(
    private http: HttpClient
  ) { }

  async requestPermissions() {


    return await PushNotifications.requestPermissions();


  }

  async checkPermissions() {


    return await PushNotifications.checkPermissions();


  }

  async register() {


    const permission =
      await PushNotifications.requestPermissions();

    if (permission.receive !== 'granted') {

      throw new Error(
        'Notification permission not granted'
      );

    }
  await LocalNotifications.requestPermissions();

    await PushNotifications.register();


  }

  tokenupdtae(
    uniqueidofdevice: string,
    token: string
  ): Observable<any> {


    return this.http.post(
      this.uri + 'api/auth/tokenupdtaefordevice',
      {
        uniqueidofdevice,
        token
      }
    );


  }

  private playNotificationSound() {


    try {

const audio = new Audio('assets/notification.wav'); 
     // const audio = new Audio('assets/notification.wav');

      audio.volume = 1;

      audio.play()
        .then(() => {
       //   alert('Notification sound played');
        })
        .catch(err => {
          alert('Audio play error' + JSON.stringify(err));
        });

    } catch (e) {

      alert('Audio error' + JSON.stringify(e));

    }


  }

 async callme(deviceInfo: any) {
await LocalNotifications.createChannel({
  id: 'orders',
  name: 'Orders',
  importance: 5,
  sound: 'notification'
});
  try {


    await PushNotifications.removeAllListeners();


    await PushNotifications.addListener(
      'registrationError',
      (error) => {

        console.log(
          'FCM Registration Error',
          error
        );

        // alert mat karo
      }
    );


    await PushNotifications.addListener(
      'registration',
      (token: Token) => {


        this.tokenupdtae(
          deviceInfo.identifier,
          token.value
        )
        .subscribe({

          next:()=>{

          },

          error:(err)=>{

            console.log(
              'Token save failed',
              err
            );

          }

        });


      }
    );



    await PushNotifications.addListener(
  'pushNotificationReceived',
  async (notification: PushNotificationSchema) => {

    console.log('Foreground Notification', notification);

    await LocalNotifications.schedule({
      notifications: [
        {
          id: Date.now(),
          title: notification.title || '',
          body: notification.body || '',
          channelId: 'orders',
          smallIcon: 'ic_stat_fastbite'
        }
      ]
    });

  }
);



    await PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (notification: ActionPerformed)=>{


        console.log(
          'Notification clicked',
          notification
        );


      }
    );



    await this.register();



  }
  catch(e){


    console.log(
      'FCM INIT ERROR',
      e
    );


  }


}

}
