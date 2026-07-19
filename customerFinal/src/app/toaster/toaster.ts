import {
  Component,
  OnInit
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import { Common } from '../services/common';

@Component({
  selector: 'app-toaster',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toaster.html',
  styleUrls: ['./toaster.css']
})
export class Toaster implements OnInit {

  toasts: any[] = [];

  constructor(
    public common: Common
  ) { }

  ngOnInit() {

    this.common.toast$
      .subscribe((toast: any) => {

        const id =
          Date.now();

        toast.id = id;

        this.toasts.push(toast);

        setTimeout(() => {

          this.removeToast(id);

        }, 3000);

      });

  }

  removeToast(id: any) {

    this.toasts =
      this.toasts.filter(
        x => x.id != id
      );

  }

}