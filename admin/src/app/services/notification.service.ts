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

  private notifications = new BehaviorSubject<any[]>([]);
  notifications$ = this.notifications.asObservable();

  private notificationAudio: HTMLAudioElement | null = null;

  constructor() {
   //alert('Service Constructor Called');

    this.requestPermission();
    this.initSocket();
  }

  // ================= SOCKET =================
  initSocket() {

   //alert('Socket Init Started');

    this.socket = io(this.uri);

    this.socket.on('connect', () => {

     //alert('Socket Connected: ' + this.socket.id);

      const userId = localStorage.getItem('userId');

     //alert('UserId: ' + userId);

      if (userId) {
        this.socket.emit('registerUser', { userId });
       //alert('User Registered');
      }

    });

    // ============ RECEIVE ============
    this.socket.on('newNotification', async (data: any) => {

     //alert('1. Notification Received');

      // update list
      const current = this.notifications.value;
      this.notifications.next([data, ...current]);

      // ================= AUDIO =================
      try {

       //alert('2. Audio Start');

        this.notificationAudio = new Audio('notification.wav');
        this.notificationAudio.loop = true;

        await this.notificationAudio.play()
          .then(() =>  {})
          .catch(err =>  {});

      } catch (e: any) {
       //alert('Audio Error: ' + e?.message);
      }

      // ================= NOTIFICATION =================
      try {

       //alert('4. Notification Check');

        if (!('serviceWorker' in navigator)) {
         //alert('Service Worker Not Supported');
          return;
        }

        const registration = await navigator.serviceWorker.ready;

       //alert('5. SW Ready');

        const options: any = {
          body: data.message,
          icon: 'logo.png',
        };

        registration.showNotification(
          data.title || 'FastBite',
          options
        );

       //alert('6. Notification Sent');

      } catch (err: any) {
       //alert('Notification Error: ' + err?.message);
      }

      // auto stop sound
      setTimeout(() => {
       //alert('7. Stop Audio');
        this.stopHooter();
      }, 15000);

    });

  }

  // ================= PERMISSION =================
  requestPermission() {

    if (!('Notification' in window)) {
     //alert('Notification Not Supported');
      return;
    }

    Notification.requestPermission()
      .then(res =>{});

  }

  // ================= STOP AUDIO =================
  stopHooter() {

    if (this.notificationAudio) {
      this.notificationAudio.pause();
      this.notificationAudio.currentTime = 0;
      this.notificationAudio = null;

     //alert('Audio Stopped');
    }

  }

  // ================= TEST =================
  sendTestNotification(msg: string) {
    this.socket.emit('sendTest', msg);
  }

}