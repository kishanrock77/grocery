import { Component } from '@angular/core';
import { Browser } from '@capacitor/browser';
import { App } from '@capacitor/app';
import { Device } from '@capacitor/device';
import { Network } from '@capacitor/network';
import {
  DomSanitizer,
  SafeResourceUrl
} from '@angular/platform-browser';

import { Geolocation } from '@capacitor/geolocation';

import {
  SpeechRecognition
} from '@capacitor-community/speech-recognition';
import { jsDocComment } from '@angular/compiler';
import { FcmService } from './services/fcm';
import { PushNotifications } from '@capacitor/push-notifications';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  hidemycontent = true;
  isOffline = false;
  safeUrl!: SafeResourceUrl;

  loading = true;

  showPermissionScreen = false;
  //  baseUrl = 'https://app.fastbite.food/login';
  baseUrl = 'https://mobileapp.fastbite.food/login';

  permissions = {

    location: false,

    microphone: false,

    notification: false // android webview issue
  };

  constructor(private router: Router,
    private sanitizer: DomSanitizer, public fcm: FcmService
  ) {

    if (localStorage.getItem('userapp')) {
      this.hidemycontent = true;
    } else {
      this.hidemycontent = false;

    }

  }
  deviceInfo: any;
  async ngOnInit() {

    window.addEventListener('message', (event: any) => {

      if (event.data?.type === 'LOGOUT') {
        localStorage.removeItem('userapp');
         
        this.hidemycontent = true;
        this.router.navigate(['/login']);

      }

    });

    const status = await Network.getStatus();
    this.isOffline = !status.connected;

    Network.addListener('networkStatusChange', (status: any) => {

      this.isOffline = !status.connected;

      if (!status.connected) {
        //  alert('Internet Not Connected');
      }

    });
    this.deviceInfo =
      await Device.getId();

    (window as any).openExternalPayment =
      async (url: string) => {

        await Browser.open({
          url: url
        });

      };

    window.addEventListener(
      'message',
      async (event: any) => {

        if (
          event.data?.type ===
          'OPEN_EXTERNAL_PAYMENT'
        ) {

          await Browser.open({
            url: event.data.url
          });

        }

      }
    );

    // =========================
    // NATIVE VOICE BRIDGE
    // =========================

    (window as any).startNativeVoiceSearch =
      () => {


        const android =
          (window as any).AndroidVoice;


        if (!android || !android.startVoiceSearch) {

          alert('Voice not supported');

          return;

        }


        android.startVoiceSearch();


      };

    (window as any).voiceHandler =
      (event: any) => {


        const text =
          event.detail;


        console.log(
          'VOICE RESULT:',
          text
        );


        const sendText = () => {


          const iframe: any =
            document.querySelector('iframe');


          if (iframe?.contentWindow) {


            iframe.contentWindow.postMessage({

              type: 'VOICE_TEXT',

              text: text

            }, '*');


          }
          else {


            setTimeout(
              sendText,
              300
            );


          }


        };


        sendText();


      };


    window.addEventListener(
      'VOICE_TEXT',
      (window as any).voiceHandler
    );


    window.addEventListener(
      'VOICE_TEXT',
      (window as any).voiceHandler
    );
    App.addListener('appStateChange', ({ isActive }) => {

      if (isActive) {

        const iframe: any =
          document.querySelector('iframe');

        iframe?.contentWindow?.postMessage({
          type: 'PAYMENT_CHECK'
        }, '*');

      }

    });
    await this.checkPermissions();
    try {

      await PushNotifications.createChannel({
        id: 'orders',
        name: 'New Orders',
        importance: 5,
        sound: 'notification',
        vibration: true
      });

      console.log('Notification channel created');

    } catch (e) {

      console.log(e);

    }
    if (this.permissions.notification) {

      this.fcm.callme(this.deviceInfo);

    }


  }

  // ====================================
  // CHECK ALL PERMISSIONS
  // ====================================

  async checkPermissions() {

    this.loading = true;

    // =========================
    // LOCATION
    // =========================

    try {

      const locPermission =
        await Geolocation.checkPermissions();
      //  alert('Location Permission:' + JSON.stringify(locPermission));
      this.permissions.location =
        locPermission.location === 'granted';

    } catch (e) {

      this.permissions.location = false;

    }

    // =========================
    // MICROPHONE
    // =========================

    try {

      const micPermission =
        await SpeechRecognition.checkPermissions();

      this.permissions.microphone =
        micPermission.speechRecognition === 'granted';

    } catch (e) {

      this.permissions.microphone = false;

    }
    // NOTIFICATION
    try {

      if ((window as any).Capacitor?.getPlatform() === 'android') {

        const permission = await this.fcm.checkPermissions();

        this.permissions.notification =
          permission.receive === 'granted';

      } else {

        this.permissions.notification = true;

      }

    } catch (e) {

      this.permissions.notification = false;

    }
    // =========================
    // ALL CHECK
    // =========================

    const allGranted =
      this.permissions.location &&
      this.permissions.microphone &&
      this.permissions.notification;

    // =========================
    // LOAD WEBSITE
    // =========================

    if (allGranted) {

      this.showPermissionScreen = false;

      //login pe login karo

      if (localStorage.getItem('userapp')) {
        this.hidemycontent = false;

        this.loadwebsite(JSON.parse(localStorage.getItem('userapp') || '{}'))
      } else {
        this.hidemycontent = true;

        this.router.navigate(['/login']);
      }

    }

    else {

      this.loading = false;

      this.showPermissionScreen = true;

    }

  }
  //allowNotification

  errnotification = '';
  notloading = false;
  async allowNotification() {

    try {
      this.notloading = true;
      this.errnotification = '';

      const permission =
        await this.fcm.requestPermissions();

      if (
        permission.receive !== 'granted'
      ) {

        this.errnotification =
          'Notification permission denied';

        return;

      }
      this.fcm.callme(this.deviceInfo);
      await this.checkPermissions();
      this.notloading = false;
    } catch (error: any) {
      this.notloading = false;
      this.errnotification =
        JSON.stringify(error);

    }

  }

  // ====================================
  // REQUEST LOCATION
  // ====================================

  err = ''; locloading = false;
  async allowLocation() {
    try {
      this.locloading = true;
      this.err = '';
      const permission = await Geolocation.requestPermissions();
      // alert('Location Permission:' + JSON.stringify(permission));
      if (permission.location !== 'granted') {
        this.err = 'Location permission not granted';
        return;
      }
      await this.checkPermissions();
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      });


      this.locloading = false;
    } catch (error: any) {
      this.locloading = false;
      if (
        error?.code === 'OS-PLUG-GLOC-0007' ||
        error?.message?.includes('Location services are not enabled')
      ) {
        this.err =
          'Please turn ON Location/GPS from phone settings and try again.'
          ;
        return;
      }

      this.err =
        'Location Error:\n' +
        JSON.stringify(error)
        ;
    }
  }

  // ====================================
  // REQUEST MIC
  // ====================================
  errm = '';
  micloading = false;
  async allowMicrophone() {
    try {
      this.micloading = true;
      this.errm = '';
      await SpeechRecognition.requestPermissions();

      await this.checkPermissions();
      this.micloading = false;
    } catch (e) {

      this.micloading = false;
      this.errm = 'Microphone permission not granted';


    }
  }

  // ====================================
  // LOAD WEBSITE
  // ====================================

  async loadwebsite(user: any) {

    let finalUrl = this.baseUrl;

    try {

      const position =
        await Geolocation.getCurrentPosition({
          enableHighAccuracy: true
        });

      const lat =
        position.coords.latitude;

      const lng =
        position.coords.longitude;

      let address = '';

      try {

        const response =
          await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
          );

        const data =
          await response.json();

        address =
          data.display_name || '';

      } catch (e) {

        console.log(e);

      }

      finalUrl =
        `${this.baseUrl}?v=1&isalreadyloggedin=true&_id=${user._id}&uniqueidofdevice=${this.deviceInfo.identifier}&lat=${lat}&lng=${lng}&address=${encodeURIComponent(address)}`;

    } catch (e) {

      console.log(e);

    }

    this.safeUrl =
      this.sanitizer
        .bypassSecurityTrustResourceUrl(
          finalUrl
        );

    setTimeout(() => {
      this.loading = false;
    }, 1000);


  }

  onLoad() {

    this.loading = false;

  }

}