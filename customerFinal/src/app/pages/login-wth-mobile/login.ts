import { Component, OnDestroy } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

import { AuthService } from '../../services/auth';
import { Common } from '../../services/common';
import { FcmService } from '../../services/fcm';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent implements OnDestroy {

  // 🔐 STATES
  view: 'login' | 'forgot-mobile' | 'forgot-otp' | 'reset-password' = 'login';

  // 📱 USER INPUTS
  mobile: string = '';
  password: string = '';
  newPassword: string = '';
  pwdTouched: boolean = false;
  // 🔢 OTP (4 BOX)
  otpArray: string[] = ['', '', '', ''];

  // UI
  mobileTouched: boolean = false;
  timer: number = 30;
  interval: any;
  uniqueidofdevice: any = '';
  showappupdatemessage = false;

  loginSubscription?: Subscription;
  updateDeviceSubscription?: Subscription;
  forgotOtpSubscription?: Subscription;
  verifyOtpSubscription?: Subscription;
  resendOtpSubscription?: Subscription;
  resetPasswordSubscription?: Subscription;
  focusTimeout?: ReturnType<typeof setTimeout>;
  constructor(
    private auth: AuthService,
    public common: Common, private fcm: FcmService,
    private router: Router
  ) {


    const urlParams = new URLSearchParams(window.location.search);
    const versionfromapp = urlParams.get('v');
    let angularversion = '1'
    const lat = urlParams.get('lat');
    this.uniqueidofdevice = urlParams.get('uniqueidofdevice');



    const lng = urlParams.get('lng');
    const address = urlParams.get('address');
    console.log('Latitude:', lat);
    console.log('Longitude:', lng);
    console.log('Address:', address);
    if (versionfromapp) {
      if (angularversion != versionfromapp) {
        this.showappupdatemessage = true;
      }
    }


    localStorage.setItem('version_from_app', versionfromapp || '1');
    localStorage.setItem('lat_from_app', lat || '');
    localStorage.setItem('lng_from_app', lng || '');
    localStorage.setItem('address_from_app', address || '');
    if (this.uniqueidofdevice) {
      this.common.browserorapp = 'app';
      localStorage.setItem('browserorapp', this.common.browserorapp)
    } else {
      if (localStorage.getItem('browserorapp')) {
        this.common.browserorapp = localStorage.getItem('browserorapp');
      }
      else {
        this.common.browserorapp = 'browser';
        localStorage.setItem('browserorapp', this.common.browserorapp)
      }


    }

    if (this.auth.isloggedIn()) {

      if (this.uniqueidofdevice) {


        if (localStorage.getItem('uniqueidofdevice_from_app')) {
          if (localStorage.getItem('uniqueidofdevice_from_app') != this.uniqueidofdevice) {
            this.upadtedeviceuniqueid(this.uniqueidofdevice);
          }
        } else {
          this.upadtedeviceuniqueid(this.uniqueidofdevice);
        }
      }


      if (this.auth.isAreaSelected()) {
        this.router.navigate(['/home']);
      } else {
        this.router.navigate(['/select-area/login']);
      }

    }
  }
  openetermandpoloicy(page: any) {
    window.open(this.common.websitename + '/' + page, '_blank')
  }

  ngOnDestroy() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = undefined;
    }

    this.loginSubscription?.unsubscribe();
    this.updateDeviceSubscription?.unsubscribe();
    this.forgotOtpSubscription?.unsubscribe();
    this.verifyOtpSubscription?.unsubscribe();
    this.resendOtpSubscription?.unsubscribe();
    this.resetPasswordSubscription?.unsubscribe();

    if (this.focusTimeout) {
      clearTimeout(this.focusTimeout);
      this.focusTimeout = undefined;
    }
  }
  // ===============================
  // 📱 MOBILE VALIDATION
  // ===============================

  isValidMobile(mobile: string): boolean {
    return /^[6-9]\d{9}$/.test(mobile);
  }

  onMobileChange() {
    this.mobile = this.mobile.replace(/[^0-9]/g, '');
  }
  upadtingtoken = false;
  upadtedeviceuniqueid(uniqueidofdevice: any) {
    this.upadtingtoken = true;
    this.updateDeviceSubscription?.unsubscribe();
    this.updateDeviceSubscription = this.auth.saveuniqueidofdevice(
      'customer',
      this.auth.getSession()?.userId,
      uniqueidofdevice
    ).subscribe({

      next: (res: any) => {
        this.upadtingtoken = false;
        console.log('Unique ID of device updated successfully');
        localStorage.setItem('uniqueidofdevice_from_app', uniqueidofdevice || '');
      },
      error: (err: any) => {
        this.upadtingtoken = false;
        console.log('Failed to update unique ID of device')
        // this.common.alertmessage(
        //   err.error.msg || 'Unique ID of device update failed',
        //   'Alert',
        //   'error'  
        // )  
      }
    });

  }
  // ===============================
  // 🔐 LOGIN
  // ===============================
  loading: boolean = false;
  login() {
    if (!this.mobile || !this.password) {
      return this.common.alertmessage("Enter all fields", "Alert", "error");
    }

    if (!this.isValidMobile(this.mobile)) {
      return this.common.alertmessage("Enter valid mobile number", "Alert", "error");
    }
    this.loading = true;
    this.loginSubscription?.unsubscribe();
    this.loginSubscription = this.auth.login({
      mobile: this.mobile,
      password: this.password
    }).subscribe((res: any) => {
      this.loading = false;
      if (res.success) {
        this.auth.isloggedInV = true;

        console.log(res.user._id, localStorage.getItem('lastuserId'))
        if (res.user._id !== localStorage.getItem('lastuserId')) {
          localStorage.clear();


        }
        localStorage.setItem('userId', res.user._id);
        localStorage.setItem('user', JSON.stringify(res.user));
        //  this.common.speak("Welcome " + res.user.name + ' you have logged in successfully');
        this.auth.saveSession(res.user);



        if (this.uniqueidofdevice) {
          if (localStorage.getItem('uniqueidofdevice_from_app')) {
            if (localStorage.getItem('uniqueidofdevice_from_app') != this.uniqueidofdevice) {
              this.upadtedeviceuniqueid(this.uniqueidofdevice);
            }
          } else {
            this.upadtedeviceuniqueid(this.uniqueidofdevice);
          }
        }

        this.fcm.callme(res.user._id, 'customer');
        this.router.navigate(['/select-area/login']);
      } else {
        this.common.alertmessage(res.message, 'error', 'error');
      }

    }, () => {
      this.loading = false;

      this.common.alertmessage('Server error', 'Error', 'error');
    });
  }

  // ===============================
  // 🔁 NAVIGATION
  // ===============================

  goToForgot() {
    this.view = 'forgot-mobile';
    this.mobileTouched = false;
  }

  goToLogin() {
    this.view = 'login';
  }

  goToRegister() {
    this.router.navigate(['/signup']);
  }

  // ===============================
  // 📲 SEND OTP
  // ===============================

  sendForgotOtp() {

    if (!this.isValidMobile(this.mobile)) {
      return this.common.alertmessage("Enter valid mobile number", "Alert", "error");
    }
    this.loading = true;
    this.forgotOtpSubscription?.unsubscribe();
    this.forgotOtpSubscription = this.auth.sendForgotOtp({ mobile: this.mobile })
      .subscribe((res: any) => {
        this.loading = false;
        if (res.success) {
          this.common.alertmessage("OTP sent successfully", "Success", "success");

          this.view = 'forgot-otp';
          this.startTimer();
          this.resetOtp();

          this.focusTimeout && clearTimeout(this.focusTimeout);
          this.focusTimeout = setTimeout(() => this.focusFirstOtp(), 100);

        } else {
          this.common.alertmessage(res.message, 'Error', 'error');
        }

      }, () => {
        this.loading = false;
        this.common.alertmessage('Something went wrong', 'Error', 'error');
      });
  }

  // ===============================
  // 🔢 OTP HANDLING
  // ===============================

  moveNext(event: any, index: number) {
    const input = event.target;

    // only numbers
    input.value = input.value.replace(/[^0-9]/g, '');
    this.otpArray[index] = input.value;

    // next focus
    if (input.value && input.nextElementSibling) {
      input.nextElementSibling.focus();
    }

    // backspace previous
    if (!input.value && event.inputType === 'deleteContentBackward' && input.previousElementSibling) {
      input.previousElementSibling.focus();
    }

    // 🔥 AUTO SUBMIT
    const otp = this.getOtp();
    if (otp.length === 4 && !otp.includes('')) {
      this.verifyOtp();
    }
  }

  handlePaste(event: ClipboardEvent) {

    const pasteData = event.clipboardData?.getData('text') || '';

    // sirf 4 digit allow
    if (/^\d{4}$/.test(pasteData)) {

      this.otpArray = pasteData.split('');

      // last input pe focus
      setTimeout(() => {
        const inputs = document.querySelectorAll('.otp-container input');
        (inputs[3] as HTMLElement)?.focus();
      }, 50);

      // 🔥 auto submit
      setTimeout(() => {
        this.verifyOtp();
      }, 100);

    } else {
      // galat paste ko block karo
      event.preventDefault();
    }
  }
  getOtp(): string {
    return this.otpArray.join('');
  }

  resetOtp() {
    this.otpArray = ['', '', '', ''];
  }

  focusFirstOtp() {
    const el = document.querySelector('.otp-container input') as HTMLElement;
    el?.focus();
  }

  // ===============================
  // 🔐 VERIFY OTP
  // ===============================

  isVerifying = false;

  verifyOtp() {

    if (this.isVerifying) return;

    const otp = this.getOtp();

    if (otp.length !== 4) {
      return;
    }

    this.isVerifying = true;

    this.verifyOtpSubscription?.unsubscribe();
    this.verifyOtpSubscription = this.auth.verifyOtp({
      mobile: this.mobile,
      otp: otp
    }).subscribe((res: any) => {

      this.isVerifying = false;

      if (res.success) {
        this.view = 'reset-password';
        this.common.alertmessage('Mobile verified successfully', 'Success', 'success');

      } else {
        this.common.alertmessage(res.message, 'Error', 'error');
      }

    }, () => {
      this.isVerifying = false;
      this.common.alertmessage('Verification failed', 'Error', 'error');
    });
  }
  // ===============================
  // 🔁 RESEND OTP
  // ===============================
  changeNumber() {
    this.view = 'forgot-mobile';

    // reset all data
    this.mobile = '';
    this.mobileTouched = false;

    this.otpArray = ['', '', '', ''];
    this.isVerifying = false;


    // timer stop
    clearInterval(this.interval);
    this.timer = 0;
  }
  resendOtp() {
    if (this.loading) {
      return;
    }
    this.loading = true;
    this.resendOtpSubscription?.unsubscribe();
    this.resendOtpSubscription = this.auth.resendOtp({
      mobile: this.mobile,
      type: 'forgot'
    }).subscribe((res: any) => {
      this.loading = false;
      if (res.success) {
        this.common.alertmessage("OTP resent", "Success", "success");
        this.startTimer();
        this.resetOtp();
      } else {
        this.common.alertmessage(res.message, 'Error', 'error');
      }

    });
  }

  // ===============================
  // ⏱ TIMER
  // ===============================

  startTimer() {

    if (this.interval) clearInterval(this.interval);

    this.timer = 30;

    this.interval = setInterval(() => {
      if (this.timer > 0) {
        this.timer--;
      } else {
        clearInterval(this.interval);
      }
    }, 1000);
  }

  // ===============================
  // 🔁 RESET PASSWORD
  // ===============================

  resetPassword() {

    if (!this.newPassword) {
      return this.common.alertmessage("Enter new password", "Warning", "warning");
    }

    this.resetPasswordSubscription?.unsubscribe();
    this.resetPasswordSubscription = this.auth.resetPassword({
      mobile: this.mobile,
      otp: this.getOtp(),
      newPassword: this.newPassword
    }).subscribe((res: any) => {

      if (res.success) {
        this.common.alertmessage("Password updated", "Success", "success");
        this.view = 'login';
      } else {
        this.common.alertmessage(res.message, 'Error', 'error');
      }

    }, () => {
      this.common.alertmessage('Something went wrong', 'Error', 'error');
    });
  }
}