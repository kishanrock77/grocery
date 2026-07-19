import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FcmService } from '../../services/fcm';

import { AuthService } from '../../services/auth';
import { Common } from '../../services/common';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'signup-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './signup.html',
  styleUrls: ['./signup.css']
})
export class Signup {
  uniqueidofdevice: any = '';
  constructor(
    private auth: AuthService, private fcm: FcmService,
    private common: Common, private notificationService:
      NotificationService,
    private router: Router
  ) {

    this.notificationService
      .requestPermission();
    if (this.auth.isloggedIn()) {
      this.notificationService.initSocket();
      if (this.auth.isAreaSelected()) {
        this.router.navigate(['/home']);
      } else {
        this.router.navigate(['/select-area/signup']);
      }

    } else {

      this.uniqueidofdevice = localStorage.getItem('uniqueidofdevice_for_register_page');
      // this.router.navigate(['/login']);
    }


  }
  view: 'mobile' | 'otp' | 'details' = 'mobile';

  mobile = '';
  name = '';
  password = '';
  confirmPassword = '';

  otpArray: string[] = ['', '', '', ''];

  timer = 30;
  interval: any;
  isVerifying = false;
  mobileTouched = false;
  // 📱 VALIDATION
  isValidMobile(m: string) {
    return /^[6-9]\d{9}$/.test(m);
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
  onMobileChange() {
    this.mobile = this.mobile.replace(/[^0-9]/g, '');
  }
  goToLogin() {
    this.router.navigate(['/login']);
  }
  // 📲 SEND OTP
  loading: boolean = false;
  sendOtp(sendinreal = false) {
    this.loading = true;
    this.auth.sendRegisterOtp({
      mobile: this.mobile,
      uniqueidofdevice: this.uniqueidofdevice,
      fcm: this.fcm.tokeninservice, apporbrowser: localStorage.getItem('browserorapp'),
      sendinreal: sendinreal
    }).subscribe((res: any) => {

      if (res.success) {
        if (sendinreal == true) {
          this.loading = false;
          this.view = 'otp';
          this.startTimer();
          this.notificationService.initSocket(res.userID);

        } else {
          this.sendOtp(true);
        }

      } else {
        this.common.alertmessage(res.message, 'warning', 'warning');
      }
    }, (err: any) => {
      this.loading = false;
      this.common.alertmessage(err.error?.message || 'Failed to send OTP', 'Error', 'error');
    });
  }

  // 🔢 OTP
  moveNext(e: any, i: number) {
    const input = e.target;
    input.value = input.value.replace(/[^0-9]/g, '');
    this.otpArray[i] = input.value;

    if (input.value && input.nextElementSibling) {
      input.nextElementSibling.focus();
    }

    const otp = this.otpArray.join('');
    if (otp.length === 4 && !otp.includes('')) {
      this.verifyOtp();
    }
  }

  // 🔐 VERIFY
  verifyOtp() {

    if (this.isVerifying) return;

    const otp = this.otpArray.join('');
    if (otp.length !== 4) return;

    this.isVerifying = true;

    this.auth.verifyOtp({ mobile: this.mobile, otp }).subscribe((res: any) => {
      this.isVerifying = false;

      if (res.success) {
        this.common.alertmessage('Mobile verified successfully', 'Success', 'success');
        this.view = 'details';
      } else {
        this.common.alertmessage('Invalid OTP !', 'Error', 'error');

      }
    });
  }

  // 🔁 RESEND
  resendOtp() {
    if (this.loading) {
      return;
    }
    this.loading = true;
    this.auth.resendOtp({ mobile: this.mobile, type: 'verify' }).subscribe((res) => {

      this.loading = false;


      if (res.success) {
        this.common.alertmessage("OTP resent", "Success", "success");
        this.startTimer();
      } else {
        this.common.alertmessage(res.message, 'Error', 'error');
      }
    });
  }

  // ⏱ TIMER
  startTimer() {
    this.timer = 30;
    clearInterval(this.interval);

    this.interval = setInterval(() => {
      if (this.timer > 0) this.timer--;
      else clearInterval(this.interval);
    }, 1000);
  }
  changeNumber() {
    this.view = 'mobile';

    // reset all data
    this.mobile = '';
    this.mobileTouched = false;

    this.otpArray = ['', '', '', ''];
    this.isVerifying = false;

    this.name = '';
    this.password = '';
    this.confirmPassword = '';

    // timer stop
    clearInterval(this.interval);
    this.timer = 0;
  }

  nameTouched = false;
  passwordTouched = false;
  confirmTouched = false;

  register() {

    // mark all touched
    this.nameTouched = true;
    this.passwordTouched = true;
    this.confirmTouched = true;

    if (!this.name || !this.password || !this.confirmPassword) {
      this.common.alertmessage('Please fill all fields', 'Error', 'error');
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.common.alertmessage('Passwords do not match', 'Error', 'error');
      return;
    }
    this.loading = true;
    // API call
    this.auth.register({
      mobile: this.mobile,
      name: this.name,
      password: this.password
    }).subscribe((res: any) => {
      this.loading = false;
      if (res.success) {
        this.router.navigate(['/login']);
      } else {
        this.common.alertmessage(res.message, 'Error', 'error');
      }

    }, err => {
      this.loading = false;
      this.common.alertmessage(err.error?.message || 'Registration failed', 'Error', 'error');
    }
    );
  }
  // 🧾 REGISTER

}