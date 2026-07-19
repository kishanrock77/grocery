// login.ts
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth';
import { CommonModule } from '@angular/common';
import { Common } from '../../services/common';
import { FcmService } from '../../services/fcm';

@Component({
  selector: 'login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login {
  userType: any = 'admin';
  loginForm; urlllll = '';
  isurlhavelogintype = false;
  brandname = ''; uniqueidofdevice: any = '';
  constructor(private fb: FormBuilder, private fcm: FcmService, private common: Common,
    private auth: AuthService,
    private router: Router) {
    this.brandname = this.common.brandname;

    this.urlllll = window.location.href;
    const urlParams = new URLSearchParams(window.location.search);


    this.uniqueidofdevice = urlParams.get('uniqueidofdevice');

    if (urlParams.get('logintype')) {
      this.userType = urlParams.get('logintype');
      this.isurlhavelogintype = true;
    }



    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });

    if (this.auth.isloggedIn()) {
      let session = this.auth.getSession();

      if (this.uniqueidofdevice || localStorage.getItem('uniqueidofdevice_from_app')) {

        this.uniqueidofdevice = this.uniqueidofdevice || localStorage.getItem('uniqueidofdevice_from_app');
        this.upadtedeviceuniqueid(this.uniqueidofdevice, 2);
      } else {
        this.wprk2();
      }




    }




  }
  wprk2() {
    let session = this.auth.getSession();

    if (session.userType === 'admin') this.router.navigate(['/admin-dashboard']);
    else if (session.userType === 'store') this.router.navigate(['/select-store']);
    else if (session.userType === 'deliveryboy') this.router.navigate(['/deliveryboy-dashboard']);

  }
  upadtedeviceuniqueid(uniqueidofdevice: any, worknumber: number) {


    this.auth.saveuniqueidofdevice(
      this.userType,
      this.auth.getSession()?.userId,
      uniqueidofdevice
    ).subscribe({

      next: (res: any) => {
        console.log('Unique ID of device updated successfully');
        localStorage.setItem('uniqueidofdevice_from_app', uniqueidofdevice || '');
        if (worknumber === 1) {
          this.wprk1();
        } else {
          this.wprk2();
        }
      },
      error: (err: any) => {
        console.log('Failed to update unique ID of device')
        // this.common.alertmessage(
        //   err.error.msg || 'Unique ID of device update failed',
        //   'Alert',
        //   'error'  
        // )  
      }
    });

  }
  selectUserType(type: string) {
    this.userType = type;

  }
  login() {
    if (!this.userType) {
      this.common.alertmessage('Please select Admin or Delivery Boy', 'Alert', 'warning');
      return;
    }
    if (this.loginForm.invalid) {
      this.common.alertmessage('Please enter email and password', 'Alert', 'warning');
      return;
    }


    const { email, password } = this.loginForm.value;
    this.auth.login(this.userType, email!, password!).subscribe({
      next: (res) => {
        if (this.userType == 'admin') {
          this.auth.setSession(res.userId, this.userType, res.userId, res.user);
        } else {
          this.auth.setSession(res.userId, this.userType, res.addedBy, res.user);
        }
        this.fcm.callme(res.userId, this.userType);
        if (this.uniqueidofdevice) {
          this.upadtedeviceuniqueid(this.uniqueidofdevice, 1);
        } else {
          this.wprk1();
        }

        // if (!res.user.fcmToken) {

        //}else{
        //    this.fcm.listen();
        //}


      },
      error: (err) => this.common.alertmessage(err.error.msg || 'Login failed', 'Alert', 'error')
    });
  }
  wprk1() {

    this.router.navigate([this.userType === 'admin' ? '/admin-dashboard' : this.userType === 'store' ? '/select-store' : '/deliveryboy-dashboard']);
  }

}