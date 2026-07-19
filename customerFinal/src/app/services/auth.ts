import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Router, RouterModule } from '@angular/router';
import { Common } from './common';

@Injectable({ providedIn: 'root' })
export class AuthService {

  uri: string = environment.commonURL;

  constructor(private http: HttpClient, private common: Common,
    private router: Router) { }

  isloggedInV = false;

  // ===============================
  // 🔐 LOGIN
  // ===============================
  login(data: any): Observable<any> {
    return this.http.post(this.uri + `api/customer/login`, data);
  }
  loginwithid(data: any): Observable<any> {
    return this.http.post(this.uri + `api/customer/loginwithid`, data);
  }

  // ===============================
  // 📲 REGISTER FLOW
  // ===============================

  // 🔸 STEP 1: SEND OTP (REGISTER)
  sendRegisterOtp(data: any): Observable<any> {
    return this.http.post(this.uri + `api/customer/send-register-otp`, data);
  }

  // 🔸 STEP 2: VERIFY OTP (COMMON)
  verifyOtp(data: any): Observable<any> {
    return this.http.post(this.uri + `api/customer/verify-otp`, data);
  }

  // 🔸 STEP 3: CREATE USER
  register(data: {
    mobile: string;
    name: string;
    password: string;
  }): Observable<any> {
    return this.http.post(this.uri + `api/customer/register`, data);
  }

  // ===============================
  // 🔁 FORGOT PASSWORD
  // ===============================

  sendForgotOtp(data: any): Observable<any> {
    return this.http.post(this.uri + `api/customer/forgot-password`, data);
  }
  tokenupdtae(userType: any, userid: any, token: any): Observable<any> {
    return this.http.post(this.uri + `api/auth/tokenupdtae`, { userType, userid, token });
  }
  saveuniqueidofdevice(userType: any, userid: any, uniqueidofdevice: string): Observable<any> {
    return this.http.post(this.uri + `api/auth/saveuniqueidofdevice`, { userType, userid, uniqueidofdevice });
  }
  resetPassword(data: {
    mobile: string;
    otp: string;
    newPassword: string;
  }): Observable<any> {
    return this.http.post(this.uri + `api/customer/reset-password`, data);
  }

  // ===============================
  // 🔁 RESEND OTP (COMMON)
  // ===============================

  resendOtp(data: any): Observable<any> {
    return this.http.post(this.uri + `api/customer/resend-otp`, data);
  }

  // ===============================
  // 👤 USER PROFILE
  // ===============================

  getProfile(mobile: string): Observable<any> {
    return this.http.get(this.uri + `api/customer/profile/${mobile}`);
  }
  getProfilebyid(customeid: any): Observable<any> {
    return this.http.get(this.uri + `api/customer/profilebyid/${customeid}`);
  }
  updatUser(userobj: any) {
    return this.http.post(this.uri + `api/customer/updatUser`, userobj);
  }
  // ===============================
  // 🧠 SESSION
  // ===============================

  saveSession(user: any) {

    localStorage.setItem('userId', user._id);
    localStorage.setItem('lastuserId', user._id);
    localStorage.setItem('user', JSON.stringify(user));
    this.isloggedInV = true;
  }

  getSession() {
    const userRaw = localStorage.getItem('user');
    const areaRaw = localStorage.getItem('selectedArea');

    return {
      userId: localStorage.getItem('userId'),
      user: userRaw ? this.parseJSON(userRaw) : null,
      selectedArea: areaRaw ? this.parseJSON(areaRaw) : null
    };
  }

  isloggedIn(): boolean {
    return !!localStorage.getItem('userId');
  }
  isAreaSelected(): boolean {
    return !!localStorage.getItem('selectedArea');
  }
  logout() {
    this.isloggedInV = false;
    localStorage.removeItem('userId');
    localStorage.removeItem('user');
    // localStorage.removeItem('lat_from_app');
    // localStorage.removeItem('lng_from_app');
    // localStorage.removeItem('address_from_app');



    //this.common.cartSubject.next([]); // 🔥 REAL-TIME TRIGGER
    // localStorage.removeItem('cartArray');//to do...is line ko htale

  }
  logoutredirect() {

    this.logout();
    if (localStorage.getItem('browserorapp') == 'browser') {
      this.router.navigate(['/login']);

    } else {
      this.router.navigate(['/login']);
      window.parent.postMessage({
        type: 'LOGOUT'
      }, '*');
    }


  }
  private parseJSON(data: any) {
    try {
      return JSON.parse(data);
    } catch (e) {
      return null;
    }
  }
  getAdminId() {
    return localStorage.getItem("adminId");
  }


  // ===============================
  // GOOGLE LOGIN
  // ===============================

  googleLogin(data: {
    idToken: string;
    fcmToken?: string;
    uniqueidofdevice?: string;
  }): Observable<any> {

    return this.http.post(
      this.uri + `api/customer/google-login`,
      data
    );

  }

  // ===============================
  // SAVE MOBILE
  // ===============================

  saveMobile(data: {
    userId: string;
    mobile: string;
  }): Observable<any> {

    return this.http.post(
      this.uri + `api/customer/save-mobile`,
      data
    );

  }
}