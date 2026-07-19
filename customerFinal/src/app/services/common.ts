import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Common {
  
  browserorapp: any | undefined ;
  websuburi: string = environment.websuburi;
  weburi: string = environment.weburi;
  uri: string = environment.commonURL;
  appwaliwebsite: string = environment.appwaliwebsite;
  brandname: string = environment.brandname;
  websitename: string = environment.websitename;
  bowseditemarr: any = [];
  storelist: any[] = [];
  itemArr: any = {};
  categorylist: any[] = [];
  cartArr: any[] = [];
  selectedaddress: any = null;
  countofcartitems = 0;
  storedistance: any = {};

  storedistanceSubject =
    new BehaviorSubject<any>({});
  toast$ = new Subject<any>();
  // getCart() {
  //   return JSON.parse(localStorage.getItem('cartArray') || '[]');
  // }



  speak(text: string) {

    try {

      const synth = window.speechSynthesis;

      // 🔥 STOP OLD SPEECH (IMPORTANT)
      synth.cancel();

      const utterance = new SpeechSynthesisUtterance(text);

      utterance.lang = 'en-IN';
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.volume = 1;

      utterance.onend = () => {
        console.log('Speech finished');
      };

      utterance.onerror = (e) => {
        console.log('Speech error:', e);
      };

      // 🔥 Delay helps Android WebView stability
      setTimeout(() => {
        synth.speak(utterance);
      }, 100);

    } catch (e) {
      console.log('TTS failed:', e);
    }

  }


  alertmessage(
    message: string,
    title: string = 'Alert',
    type: 'success' | 'warning' | 'error' | 'info' = 'info'
  ) {

   // this.speak(message);
    //window.alert(message);
    this.toast$.next({

      message,
      title,
      type

    });

  }
  selectedAddressUpdated =
    new BehaviorSubject<any>(null);

  selectedAddressUpdated$ =
    this.selectedAddressUpdated.asObservable();


  popofitemcondition = new BehaviorSubject<any>(null);

  popofitemcondition$ = this.popofitemcondition.asObservable();


  amionwhishlist = false;

  // 🔥 CART
  private cart: any[] = [];

  // 🔥 OBSERVABLE
  private cartUpdated =
    new BehaviorSubject<any[]>([]);

  cartUpdated$ =
    this.cartUpdated.asObservable();

  constructor() {
    // localstorage se load
    const savedstoredis =
      localStorage.getItem(
        'storedistance'
      );

    if (savedstoredis) {

      this.storedistance =
        JSON.parse(savedstoredis);

      this.storedistanceSubject.next(
        this.storedistance
      );
    }

    this.selectedaddress = JSON.parse(
      localStorage.getItem('selectedAddress') || 'null'
    );

    this.selectedAddressUpdated.next(
      this.selectedaddress
    );
    const saved =
      localStorage.getItem('cart');

    this.cart =
      saved ? JSON.parse(saved) : [];

    this.cartUpdated.next(this.cart);

  }
  calculateStoreDistance(
    storeId: any,
    storeLat: number,
    storeLng: number,
    userLat: number,
    userLng: number
  ) {

    const key =
      `${storeId}_${userLat}_${userLng}`;

    // agar pahle se exist hai
    if (this.storedistance[key]) {
      this.storedistanceSubject.next(
        this.storedistance
      );
      return this.storedistance[key];
    }

    // =========================
    // HAVERSINE FORMULA
    // =========================

    const distance =
      this.getDistanceInKm(
        userLat,
        userLng,
        storeLat,
        storeLng
      );

    // 20 km/h speed
    const totalMinutes =
      ((distance / 20) * 60) + 15;// add 15 min for order preparation time

    let minuteorhr = '';

    if (totalMinutes < 60) {

      minuteorhr =
        `${Math.round(totalMinutes)} min`;

    } else {

      const hr =
        Math.floor(totalMinutes / 60);

      const min =
        Math.round(totalMinutes % 60);

      minuteorhr =
        `${hr} hr ${min} min`;
    }

    const data = {

      distanceinkm:
        Number(distance.toFixed(2)),

      minuteorhr
    };

    // save in object
    this.storedistance[key] = data;

    // localstorage save
    localStorage.setItem(
      'storedistance',
      JSON.stringify(this.storedistance)
    );

    // subject next
    this.storedistanceSubject.next(
      this.storedistance
    );

    return data;

  }

  // =========================
  // DISTANCE FORMULA
  // =========================

  getDistanceInKm(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {

    const R = 6371;

    const dLat =
      this.deg2rad(lat2 - lat1);

    const dLon =
      this.deg2rad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) *
      Math.sin(dLat / 2) +

      Math.cos(
        this.deg2rad(lat1)
      ) *

      Math.cos(
        this.deg2rad(lat2)
      ) *

      Math.sin(dLon / 2) *

      Math.sin(dLon / 2);

    const c =
      2 * Math.atan2(
        Math.sqrt(a),
        Math.sqrt(1 - a)
      );

    return R * c;
  }

  deg2rad(deg: number): number {

    return deg * (
      Math.PI / 180
    );
  }
  // =========================
  // GET
  // =========================

  getCart() {

    return this.cart;

  }
  clearCart() {

    this.cart = [];
    localStorage.removeItem('cart');
    this.cartUpdated.next(this.cart);

  }
  // =========================
  // SAVE
  // =========================
  setCart(cart: any[]) {

    this.cart = cart;

    localStorage.setItem(
      'cart',
      JSON.stringify(cart)
    );

    this.cartUpdated.next([
      ...this.cart
    ]);
    console.log("setCart common cart", this.cart)

  }
  saveCart() {

    this.setCart(this.cart);

  }
  showConfirm = false;

  confrimquestin = '';

  private confirmResolver: any = null;

  // OPEN

  confirmopen(confrimquestin: any): Promise<boolean> {

    this.showConfirm = true;

    this.confrimquestin = confrimquestin;

    return new Promise((resolve) => {

      this.confirmResolver = resolve;

    });

  }

  // OK

  confrimok() {

    this.showConfirm = false;

    if (this.confirmResolver) {

      this.confirmResolver(true);

    }

  }

  // CANCEL

  confirmcalcel() {

    this.showConfirm = false;

    if (this.confirmResolver) {

      this.confirmResolver(false);

    }

  }

}