// auth.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  websuburi: string = environment.websuburi;
  weburi: string = environment.weburi;
  uri: string = environment.commonURL;
  constructor(private http: HttpClient) {
    if (localStorage.getItem('storename')) {
      this.storename = localStorage.getItem('storename');
    }


  }
  isloggedInV = false;
  userType: string | null = null;
  storename: any = '';
  login(userType: string, email: string, password: string): Observable<any> {
    return this.http.post(this.uri + `api/auth/login`, { userType, email, password });
  }
  tokenupdtae(userType: any, userid: any, token: any): Observable<any> {
    return this.http.post(this.uri + `api/auth/tokenupdtae`, { userType, userid, token });
  }

  signup(data: any): Observable<any> {
    return this.http.post(this.uri + `api/auth/signup`, data);
  }
  saveuniqueidofdevice(userType: any, userid: any, uniqueidofdevice: string): Observable<any> {
    return this.http.post(this.uri + `api/auth/saveuniqueidofdevice`, { userType, userid, uniqueidofdevice });
  }
  setSession(userId: string, userType: string, adminId: string, user: any) {
    localStorage.setItem('userId', userId);
    localStorage.setItem('userType', userType);
    localStorage.setItem('user', JSON.stringify(user));
    this.isloggedInV = true;
    this.userType = userType;
    if (userType === 'admin') {
      localStorage.setItem('adminId', userId);
    } else {
      // jab delevery boy and store login krega to table me se hi admin id aa jayegi
      localStorage.setItem('adminId', adminId);
    }
  }

  getSession() {
    const userStr = localStorage.getItem('user');
    return {
      user: userStr && userStr !== 'undefined' ? JSON.parse(userStr) : {},
      userId: localStorage.getItem('userId'),
      storeName: localStorage.getItem('storename'),
      storeId: localStorage.getItem('storeId'),
      adminId: localStorage.getItem('adminId'),
      userType: localStorage.getItem('userType')
    };
  }
  isloggedIn(): boolean {
    return !!localStorage.getItem('userId');
  }
  getAdminId() {
    return localStorage.getItem("adminId");
  }
  logout() {
    this.isloggedInV = false;
    this.userType = null;
    localStorage.removeItem('userId');
    localStorage.removeItem('userType');
    localStorage.removeItem('adminId');
    localStorage.removeItem('storeId');

  }

  logoutredirect() {
    this.logout();
    window.location.href = '/login';
    

  }
}