import { Component } from '@angular/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Geolocation } from '@capacitor/geolocation';
import { Device } from '@capacitor/device';
import { Network } from '@capacitor/network';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  //  baseUrl = 'https://app.fastbite.food/login';
  baseUrl = 'https://mobileapp.fastbite.food/login';

  loading = false;
  isloggedin = false;
  constructor(
    private http: HttpClient,
    private sanitizer: DomSanitizer,
  ) {

    if (localStorage.getItem('userapp')) {
      this.isloggedin = true;
    }

  }
  isOffline = false;
  safeUrl!: SafeResourceUrl;
  deviceInfo: any;
  async ngOnInit() {
    if (localStorage.getItem('userapp')) {
      this.loadwebsite(JSON.parse(localStorage.getItem('userapp') || '{}'))
    }
    const status = await Network.getStatus();
    this.isOffline = !status.connected;

    Network.addListener('networkStatusChange', (status: any) => {

      this.isOffline = !status.connected;

      if (!status.connected) {
        //  alert('Internet Not Connected');
      }

    });
    await GoogleAuth.initialize({
      clientId: '53907603345-77b74cahufec62hap6odhsfiv6oa4rir.apps.googleusercontent.com',
      scopes: ['profile', 'email'],
      grantOfflineAccess: true
    });

  }
  openetermandpoloicy(page: any) {
    window.open('https://fastbite.food/' + page, '_blank')
  }
  async googleLogin() {

    if (this.loading) {
      return;
    }

    this.loading = true;

    try {

      const googleUser = await GoogleAuth.signIn();

      console.log('Google User', googleUser);

      const idToken = googleUser.authentication?.idToken;

      if (!idToken) {
        this.loading = false;
        alert('Google ID Token not found');
        return;
      }

      const body = {
        idToken: idToken,
        uniqueidofdevice: localStorage.getItem('uniqueidofdevice') || ''
      };

      this.http.post(
        'https://api.fastbite.food/api/customer/google-login',
        body
      ).subscribe({

        next: (res: any) => {

          this.loading = false;

          console.log(res);

          if (!res.success) {
            alert(res.message);
            return;
          }

          localStorage.setItem('userapp', JSON.stringify(res.user));
          this.loadwebsite(res.user)




          // Navigate here

          // this.router.navigate(['/home']);

        },

        error: (err) => {

          this.loading = false;

          console.log(err);

         

        }

      });

    }
    catch (e) {

      this.loading = false;

      console.log(e);
 
     
      this.err = JSON.stringify(e);
    }

  }
  err: any;

  async loadwebsite(user: any) {
    this.loading = true;
    this.deviceInfo =
      await Device.getId();
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