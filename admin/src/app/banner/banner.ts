import { Component } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ApiService } from '../services/api';
import { AuthService } from '../services/auth';
import { Common } from '../services/common';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-banner',
  imports: [CommonModule, ReactiveFormsModule, RouterModule, FormsModule],
  templateUrl: './banner.html',
  styleUrl: './banner.css',
})
export class Banner {

  image: any;

  preview: any;


  url = "";

  isLoading: any = false;
  list: any[] = [];

  adminId: any;

  constructor(private api: ApiService, public common: Common,
    private auth: AuthService,
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.auth.isloggedIn() || this.router.navigate(['/login']);
    let session = this.auth.getSession();
    session.userType === 'admin' || this.router.navigate(['/login']);
    this.adminId = this.auth.getAdminId()

  }


  ngOnInit() {

    this.getList();

  }



  removeImage() {

    this.image = null;

    this.preview = null;

  }

  selectImage(event: any) {


    let file =
      event.target.files[0];


    if (!file)
      return;



    if (file.size >
      1024 * 1024) {


      this.common.alertmessage(
        "Max 1MB allowed", 'warning', 'warning'
      );
      event.target.value = "";

      return;

    }




    let img = new Image();


    img.onload = () => {


      // if (
      //   img.width !== 270 ||
      //   img.height !== 133
      // ) {

      //   alert(
      //     "Only 270x133 image allowed"
      //   );


      //   this.image = null;

      //   return;

      // }


      this.image = file;


      this.preview =
        URL.createObjectURL(file);



    };



    img.src =
      URL.createObjectURL(file);



  }






  save() {


    if (!this.image) {

      this.common.alertmessage(
        "Select image", 'warning', 'warning'
      );

      return;

    }



    let fd = new FormData();


    fd.append(
      "image",
      this.image
    );


    fd.append(
      "adminId",
      this.adminId
    );


    fd.append(
      "url",
      this.url
    );


    this.isLoading = true;


    this.api.addbanner(

      fd
    )
      .subscribe((res: any) => {
        this.isLoading = false;


        if (res.success) {

          this.url = "";

          this.image = null;

          this.preview = null;


          this.getList();

        }


      });


  }








  getList() {

    this.isLoading = true;
    this.api.getListbanner(

      {
        adminId: this.adminId
      }
    )
      .subscribe((res: any) => {

        this.isLoading = false;

        this.list =
          res.data || [];


      });

  }





  delete(id: any) {


    if (!confirm(
      "Are you sure to Delete?"
    ))
      return;

    this.isLoading = true;

    this.api.deletebanner(
      id
    )
      .subscribe((res: any) => {

        this.isLoading = false;

        if (res.success) {

          this.getList();

        }


      });


  }



}
