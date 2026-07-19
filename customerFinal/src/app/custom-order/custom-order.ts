import { Component, Input, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ApiService } from '../services/api';
import { AuthService } from '../services/auth';
import { Common } from '../services/common';
import { Subheader } from '../subheader/subheader';
import { PopupService } from '../services/popup';

@Component({
  selector: 'app-customer-order',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule, Subheader
  ],
  templateUrl: './custom-order.html',
  styleUrls: ['./custom-order.css']
})
export class CustomOrderComponent implements OnDestroy {

  @Input() type: any;

  loading = false;
  customerId: any;
  adminId: any;
  cakeFlavours = [
    'Chocolate',
    'Vanilla',
    'Red Velvet',
    'Butterscotch',
    'Pineapple',
    'Strawberry',
    'Black Forest',
    'White Forest',
    'Rasmalai',
    'Fruit Cake',
    'Chocolate Truffle',
    'Coffee',
    'Oreo',
    'KitKat',
    'Blueberry',
    'Mango',
    'Almond',
    'Dry Fruit',

    'Milk Cake',
  ];


  cakeWeightsKg = [
    '1 Kg',
    '2 Kg',
    '3 Kg',
    '4 Kg',
    '5 Kg'
  ];


  cakeWeightsPound = [
    '1 Pound',
    '2 Pound',
    '3 Pound',
    '4 Pound',
    '5 Pound'
  ];


  // agar mil cake select karna hai to ye add karo
  cakeType = 'Normal';
  routeParamsSubscription?: Subscription;
  customOrderSubscription?: Subscription;

  images: any[] = [];
  pdf: any = null;

  openFilePicker() {

    const input: any = document.getElementById('fileInput');

    input.click();

  }
  extraDetail = '';


  cake = {
    flavour: '',
    message: '',
    weight: '',
    egglesstype: ''
  };


  medicalItems: any = [
    {
      name: '',
      quantity: ''
    }
  ];


  other = {
    itemName: ''
  };



  constructor(private auth: AuthService,
    public common: Common,

    public popupService: PopupService,
    private route: ActivatedRoute,
    private api: ApiService,
    private router: Router
  ) {


    this.routeParamsSubscription?.unsubscribe();

    this.routeParamsSubscription = this.route.params.subscribe(res => {

      this.type = res['customerorder_type'] || 'cake';

    });


    this.customerId =

      this.auth.getSession()?.userId;
    this.adminId =
      this.auth.getAdminId();
  }


  errorMessage: string = "";



  validateForm() {


    this.errorMessage = "";




    // IMAGE / PDF VALIDATION


    if (this.type === "medical") {


      // Medical me PDF ya Image koi ek mandatory


      if (
        (!this.images || this.images.length === 0)
        &&
        !this.pdf
      ) {


        this.errorMessage =
          "Please upload PDF or Image";


        return false;

      }


    }
    else {


      // Cake + Other me Image mandatory


      if (
        !this.images ||
        this.images.length === 0
      ) {


        this.errorMessage =
          "Please upload image";


        return false;


      }


    }






    // CAKE VALIDATION


    if (this.type === "cake") {



      if (
        !this.cake.flavour ||
        this.cake.flavour.trim() === ""
      ) {


        this.errorMessage =
          "Please select cake flavour";


        return false;


      }

      if (
        !this.cake.egglesstype ||
        this.cake.egglesstype.trim() === ""
      ) {


        this.errorMessage =
          "Please select cake With Egg or Eggless";


        return false;


      }



      if (
        !this.cake.message ||
        this.cake.message.trim() === ""
      ) {


        this.errorMessage =
          "Please enter cake message";


        return false;


      }





      if (
        !this.cake.weight ||
        this.cake.weight.trim() === ""
      ) {


        this.errorMessage =
          "Please select cake weight";


        return false;


      }


    }







    // MEDICAL VALIDATION


    if (this.type === "medical") {



      if (
        !this.medicalItems ||
        this.medicalItems.length === 0
      ) {


        this.errorMessage =
          "Please add medicine";


        return false;


      }





      for (let item of this.medicalItems) {



        if (
          !item.name ||
          item.name.trim() === ""
        ) {


          this.errorMessage =
            "Please enter medicine name";


          return false;


        }




        if (
          !item.quantity || item.quantity == 0 ||
          item.quantity === ""
        ) {


          this.errorMessage =
            "Please enter medicine quantity";


          return false;


        }



      }


    }








    // OTHER VALIDATION


    if (this.type === "other") {



      if (
        !this.other.itemName ||
        this.other.itemName.trim() === ""
      ) {


        this.errorMessage =
          "Please enter item name";


        return false;


      }


    }




    return true;


  }
  changeType(t: any) {

    this.type = t;

    this.images = [];

    this.imagePreview = [];

    this.pdf = null;

    this.pdfName = "";

  }
  removeImage(index: number) {


    this.images.splice(index, 1);


    this.imagePreview.splice(index, 1);


  }


  fileChange(event: any) {


    const files: any[] = Array.from(event.target.files);



    if (!files.length) {
      return;
    }



    // MEDICAL PDF

    if (this.type === "medical") {


      const file = files[0];



      if (file.type === "application/pdf") {


        this.pdf = file;

        this.pdfName = file.name;


        event.target.value = "";


        return;

      }


    }




    // IMAGE LIMIT 2


    let remaining =
      2 - this.images.length;



    let newFiles =
      files.slice(0, remaining);




    this.images = [

      ...this.images,

      ...newFiles

    ];





    newFiles.forEach((file: any) => {


      const reader = new FileReader();



      reader.onload = (e: any) => {


        this.imagePreview.push(

          e.target.result

        );


      };



      reader.readAsDataURL(file);



    });





    event.target.value = "";

  }


  addMedicine() {

    this.medicalItems.push({

      name: '',
      quantity: ''

    });

  }



  removeMedicine(i: number) {

    this.medicalItems.splice(i, 1);

  }


  imagePreview: any[] = [];
  pdfName: string = "";

  submit() {
    if (!this.validateForm()) {

      this.common.alertmessage(this.errorMessage, 'warning', 'warning')
      return;


    }

    let fd = new FormData();


    fd.append(
      'customerId',
      this.customerId
    );


    fd.append(
      'adminId',
      this.adminId
    );


    fd.append(
      'type',
      this.type
    );



    if (this.type === 'cake') {

      fd.append(
        'cake',
        JSON.stringify(this.cake)
      );

    }



    if (this.type === 'medical') {

      fd.append(
        'medical',
        JSON.stringify(this.medicalItems)
      );


    }



    if (this.type === 'other') {

      fd.append(
        'other',
        JSON.stringify(this.other)
      );

    }



    fd.append(
      'extraDetail',
      this.extraDetail
    );



    this.images.forEach(x => {

      fd.append(
        'images',
        x
      );

    });


    if (this.pdf) {

      fd.append(
        'pdf',
        this.pdf
      );

    }
    this.loading = true;

    this.customOrderSubscription?.unsubscribe();

    this.customOrderSubscription = this.api.customorder(fd)
      .subscribe((res: any) => {
        this.loading = false;
        if (res.success) {
          this.common.alertmessage(

            res?.message ||

            'Request submitted !',

            'success',

            'success'

          );
        } else {
          this.common.alertmessage(

            res?.message ||

            'Order failed',

            'error',

            'error'

          );
        }


        this.popupService.close();

      }, (err: any) => {
        this.loading = false;
        this.common.alertmessage(



          'Order failed',

          'error',

          'error'

        );
      });


  }

  ngOnDestroy(): void {
    this.routeParamsSubscription?.unsubscribe();
    this.customOrderSubscription?.unsubscribe();
  }

}