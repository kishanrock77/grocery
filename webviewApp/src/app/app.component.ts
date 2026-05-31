import { Component } from '@angular/core';
import { Browser } from '@capacitor/browser';
import { App } from '@capacitor/app';

import {
  DomSanitizer,
  SafeResourceUrl
} from '@angular/platform-browser';

import { Geolocation } from '@capacitor/geolocation';

import {
  SpeechRecognition
} from '@capacitor-community/speech-recognition';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  safeUrl!: SafeResourceUrl;

  loading = true;

  showPermissionScreen = false;

  baseUrl =
    'https://mobileapp.fastbite.food';

  permissions = {

    location: false,

    microphone: false,

    notification: true // android webview issue
  };

  constructor(
    private sanitizer: DomSanitizer
  ) { }

  async ngOnInit() {



    
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
    // VOICE SEARCH
    // =========================

    (window as any).startNativeVoiceSearch =
      async () => {

        const permission =
          await SpeechRecognition.requestPermissions();

        if (
          !permission.speechRecognition
        ) {

          return;

        }

        SpeechRecognition.removeAllListeners();

        SpeechRecognition.addListener(
          'partialResults',
          async (data: any) => {

            const text =
              data.matches?.[0] || '';

            const iframe: any =
              document.querySelector('iframe');

            iframe?.contentWindow?.postMessage({

              type: 'VOICE_TEXT',

              text

            }, '*');

          }
        );

        await SpeechRecognition.start({

          language: 'hi-IN',

          popup: true,

          partialResults: true,

          maxResults: 1

        });

      };

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

    // =========================
    // ALL CHECK
    // =========================

    const allGranted =

      this.permissions.location
      &&
      this.permissions.microphone;

    // =========================
    // LOAD WEBSITE
    // =========================

    if (allGranted) {

      this.showPermissionScreen = false;

      await this.loadWebsite();

    }

    else {

      this.loading = false;

      this.showPermissionScreen = true;

    }

  }

  // ====================================
  // REQUEST LOCATION
  // ====================================

  async allowLocation() {

    await Geolocation.requestPermissions();

    await this.checkPermissions();

  }

  // ====================================
  // REQUEST MIC
  // ====================================

  async allowMicrophone() {

    await SpeechRecognition.requestPermissions();

    await this.checkPermissions();

  }

  // ====================================
  // LOAD WEBSITE
  // ====================================

  async loadWebsite() {

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
        `${this.baseUrl}?v=1&lat=${lat}&lng=${lng}&address=${encodeURIComponent(address)}`;

    } catch (e) {

      console.log(e);

    }

    this.safeUrl =
      this.sanitizer
        .bypassSecurityTrustResourceUrl(
          finalUrl
        );

    this.loading = false;

  }

  onLoad() {

    this.loading = false;

  }

}