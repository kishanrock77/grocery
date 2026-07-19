import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Common {
  websuburi: string = environment.websuburi;
  weburi: string = environment.weburi;
  uri: string = environment.commonURL;
   appwaliwebsite: string = environment.appwaliwebsite;
     brandname: string = environment.brandname;
    websitename: string = environment.websitename;
    
toast$ = new Subject<any>();
  constructor() {

  }
    alertmessage(
  message: string,
  title: string = 'Alert',
  type: 'success' | 'warning' | 'error' | 'info' = 'info'
) {
//window.alert(message);
  this.toast$.next({

    message,
    title,
    type

  });

}
}