import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

import { PopupService } from '../services/popup';
import { Common } from '../services/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-areaforheader',
  imports: [CommonModule],
  templateUrl: './areaforheader.html',
  styleUrl: './areaforheader.css',
})
export class Areaforheader {
  selectedAddress: any = null;

  @Input() comingfrom: any;
  @Input() selectedAreaname: any;
  constructor(public popupService: PopupService,
    public common: Common,

    private router: Router) {

  }
  goToSelectArea() {
    this.popupService.open(
        'addressaddselect',
        'nowhere'
      );
  }
  // goToSelectArea() {
  //   if (this.selectedAddress == null) {
  //     if (this.comingfrom == 'home') {
  //       this.router.navigate(['/select-area/home']);
  //     } else {
  //       this.popupService.stack = [];


  //       setTimeout(() => {

  //         this.router.navigate(['/select-area/subheader']);

  //       }, 50);
  //     }
  //   } else {

  //     this.popupService.open(
  //       'addressaddselect',
  //       'nowhere'
  //     );
  //   }


  // }


  ngOnInit(): void {

    this.common.selectedAddressUpdated$
      .subscribe((res: any) => {
 
console.log("se cccs");
          this.selectedAddress = res;

         

      });
  }
}
