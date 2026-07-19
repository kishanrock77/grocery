import { Component } from '@angular/core';
import { AuthService } from '../services/auth';
import { ApiService } from '../services/api';
import { Common } from '../services/common';
import { Footer } from '../footer/footer';
import { Subheader } from '../subheader/subheader';

@Component({
  selector: 'app-support',
  imports: [Footer, Subheader],
  templateUrl: './support.html',
  styleUrl: './support.css',
})
export class Support {
  constructor(private auth: AuthService, private common: Common, private api: ApiService) {



  }
  copyText(text: string) {

  navigator.clipboard.writeText(text);

  this.common.alertmessage(
    'Copied successfully',
    'success',
    'success'
  );

}
  userdetails: any = {};
  ngOnInit(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
    let adminId =
      this.auth.getAdminId();

    this.api.getadmindetails(adminId).subscribe((res: any) => {
      if (res.success) {
        this.userdetails = res.user;
      } else {

        this.common.alertmessage(res.message, 'error', 'error');
        this.userdetails = {};
      }
    }, (err: any) => {
      this.common.alertmessage(err.message, 'error', 'error');
    });

  }
}
