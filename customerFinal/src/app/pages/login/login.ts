import { Component, OnDestroy } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

import { AuthService } from '../../services/auth';
import { Common } from '../../services/common';
import { FcmService } from '../../services/fcm';
import { NotificationService } from '../../services/notification.service';

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
    private auth: AuthService, private notificationService:
      NotificationService,
    public common: Common, private fcm: FcmService,
    private router: Router
  ) {


    this.notificationService
      .requestPermission();
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
        if (this.common.browserorapp == 'app') {
          this.uniqueidofdevice = localStorage.getItem('uniqueidofdevice_for_register_page');

        }
      }
      else {
        this.common.browserorapp = 'browser';
        localStorage.setItem('browserorapp', this.common.browserorapp)
      }


    }

    if (this.auth.isloggedIn()) {
      this.notificationService.initSocket();
      if (this.uniqueidofdevice) {



        if (localStorage.getItem('uniqueidofdevice_from_app')) {


          if (localStorage.getItem('uniqueidofdevice_from_app') != this.uniqueidofdevice) {


            this.upadtedeviceuniqueid(this.uniqueidofdevice, false);
          } else {
            if (this.auth.isAreaSelected()) {
              this.router.navigate(['/home']);
            } else {
              this.router.navigate(['/select-area/login']);
            }
          }
        } else {
          this.upadtedeviceuniqueid(this.uniqueidofdevice, false);
        }
      } else {
        if (this.auth.isAreaSelected()) {
          this.router.navigate(['/home']);
        } else {
          this.router.navigate(['/select-area/login']);
        }
      }




    } else {
      localStorage.setItem('uniqueidofdevice_for_register_page', this.uniqueidofdevice || '');
      this.fcm.callmeforfrontonly();
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

  private getErrorMessage(err: any): string {
    if (err?.status === 401 || err?.status === 403) {
      return 'Session expired or unauthorized';
    }

    if (err?.error?.message) {
      return err.error.message;
    }

    if (err?.message) {
      return err.message;
    }

    return 'Server error';
  }

  upadtedeviceuniqueid(uniqueidofdevice: any, red: any = false) {
    // ✅ VALIDATION - Check if userId exists
    if (!this.auth.isloggedIn()) {
      return
    }
    const userId = this.auth.getSession()?.userId;
    if (!userId) {
      this.common.alertmessage("Session not found. Please login again.", "error", "error");
      console.error('upadtedeviceuniqueid: userId is undefined');
      return;
    }

    if (!uniqueidofdevice) {
      console.warn('upadtedeviceuniqueid: uniqueidofdevice is empty');
      return;
    }


    console.log('upadtedeviceuniqueid', uniqueidofdevice, 'userId:', userId);
    this.upadtingtoken = true;
    this.updateDeviceSubscription?.unsubscribe();

    this.updateDeviceSubscription = this.auth.saveuniqueidofdevice(
      'customer',
      userId,
      uniqueidofdevice
    ).subscribe(
      (res: any) => {
        this.upadtingtoken = false;
        console.log('Device update response:', res);
        if (res.success) {
          console.log('Unique ID of device updated successfully');
          localStorage.setItem('uniqueidofdevice_from_app', uniqueidofdevice || '');
          this.notificationService.initSocket();
          if (red) {
            this.router.navigate(['/select-area/login']);
          } else {
            if (this.auth.isAreaSelected()) {
              this.router.navigate(['/home']);
            } else {
              this.router.navigate(['/select-area/login']);
            }
          }
        } else {
          // this.common.alertmessage(res.message || "Failed to update device", "error", "error");
        }
      },
      (err) => {
        this.upadtingtoken = false;
        console.error('Failed to update device id:', err);
        const errorMessage = this.getErrorMessage(err);
        // this.common.alertmessage("Failed to update device id: " + userId + " - " + errorMessage, "error", "error");
      },
      () => {
        console.log('Device update completed');
      }
    );

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


        console.log(this.uniqueidofdevice)

        if (this.uniqueidofdevice) {
          this.upadtedeviceuniqueid(this.uniqueidofdevice, true);
          this.fcm.callme(res.user._id, 'customer');
        } else {

          this.fcm.callme(res.user._id, 'customer');
          this.router.navigate(['/select-area/login']);
        }

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

  sendForgotOtp(sendinreal = false) {

    if (!this.isValidMobile(this.mobile)) {
      return this.common.alertmessage("Enter valid mobile number", "Alert", "error");
    }
    this.loading = true;
    this.forgotOtpSubscription?.unsubscribe();
    this.forgotOtpSubscription = this.auth.sendForgotOtp({
      mobile: this.mobile,
      uniqueidofdevice: this.uniqueidofdevice,
      fcm: this.fcm.tokeninservice, apporbrowser: localStorage.getItem('browserorapp'),
      sendinreal: sendinreal
    })
      .subscribe((res: any) => {

        if (res.success) {
          if (sendinreal == true) {
            this.loading = false;
            this.common.alertmessage("OTP sent successfully", "Success", "success");
            this.notificationService.initSocket(res.userID);

            this.view = 'forgot-otp';
            this.startTimer();
            this.resetOtp();

            this.focusTimeout && clearTimeout(this.focusTimeout);
            this.focusTimeout = setTimeout(() => this.focusFirstOtp(), 100);
          } else {
            this.sendForgotOtp(true);
          }


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
      type: 'forgot',
      uniqueidofdevice: this.uniqueidofdevice,
      fcm: this.fcm.tokeninservice, apporbrowser: localStorage.getItem('browserorapp')
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