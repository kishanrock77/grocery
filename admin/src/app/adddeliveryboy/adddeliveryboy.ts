import { Component } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ApiService } from '../services/api';
import { AuthService } from '../services/auth';
import { Common } from '../services/common';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-adddeliveryboy',
  imports: [CommonModule, ReactiveFormsModule, RouterModule, FormsModule],

  templateUrl: './adddeliveryboy.html',
  styleUrl: './adddeliveryboy.css',
})
export class Adddeliveryboy {

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
    this.getAreas();

  }
  getAreas() {
    this.isLoading = true;
    this.api.getAreas(this.auth.getAdminId())
      .subscribe((res: any) => {
        this.isLoading = false;
        this.deliveryPickupAreas = res.data;
      }, err => {
        this.isLoading = false;
        console.error('Error fetching areas:', err);
        this.common.alertmessage('Failed to load areas. Please try again later.', 'Error', 'error');
      });
  }
  form: any;
  selectedFile: any;
  preview: any;
  isEdit = false;
  id: any;
  isLoading = false;

  // 👉 Delivery Areas (yaha apni list daalo)
  deliveryPickupAreas: any = [
  ];

  ngOnInit() {

    this.form = this.fb.group({
      name: ['', Validators.required],
      addedBy: [this.auth.getAdminId() || '', Validators.required],

      email: ['', [Validators.required, Validators.email]],
      mobile: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      password: ['', Validators.required],
      address: ['', Validators.required],
      onsalaryorcommission: ['', Validators.required],
      comissionType: ['', Validators.required],
      commission: ['', Validators.required],
      deliveryAreas: [[], Validators.required],
      pickupAreas: [[], Validators.required]
    });

    this.route.params.subscribe(p => {
      if (p['id']) {
        this.isEdit = true;
        this.id = p['id'];
        this.getDetail();
      }
    });

    this.form.get('onsalaryorcommission')?.valueChanges.subscribe((val: string) => {

      if (val === 'salary') {

        this.form.get('commission')?.clearValidators();
        this.form.get('comissionType')?.clearValidators();

      } else {

        this.form.get('commission')?.setValidators([Validators.required]);
        this.form.get('comissionType')?.setValidators([Validators.required]);

      }

      this.form.get('commission')?.updateValueAndValidity();
      this.form.get('comissionType')?.updateValueAndValidity();

    });
  }


  /* GET DETAIL */
  getDetail() {

    this.isLoading = true;

    this.api.getDeliveryBoyDetail(this.id)
      .subscribe((res: any) => {

        this.isLoading = false;

        this.form.patchValue({
          name: res.name,
          email: res.email,
          mobile: res.mobile,
          password: res.password,
          address: res.address,
          onsalaryorcommission: res.onsalaryorcommission,
          comissionType: res.comissionType,
          commission: res.commission,
          deliveryAreas: typeof res.deliveryAreas === 'string'
            ? JSON.parse(res.deliveryAreas)
            : res.deliveryAreas || [],
          pickupAreas: typeof res.pickupAreas === 'string'
            ? JSON.parse(res.pickupAreas)
            : res.pickupAreas || []
        });

        if (res.profilePic) {
          this.preview =  res.profilePic;
        }

      }, err => {
        this.isLoading = false;
      });

  }
  toggleArea(event: any) {

    let areas = this.form.value.deliveryAreas || [];

    if (event.target.checked) {

      if (!areas.includes(event.target.value)) {
        areas.push(event.target.value);
      }

    } else {

      areas = areas.filter((a: any) => a !== event.target.value);

    }

    this.form.patchValue({ deliveryAreas: areas });

  }
  toggleAreapickup(event: any) {

    let areas = this.form.value.pickupAreas || [];

    if (event.target.checked) {

      if (!areas.includes(event.target.value)) {
        areas.push(event.target.value);
      }

    } else {

      areas = areas.filter((a: any) => a !== event.target.value);

    }

    this.form.patchValue({ pickupAreas: areas });

  }
  /* IMAGE */
  onFileSelect(e: any) {

    const file = e.target.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Only image allowed");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("Max 2MB allowed");
      return;
    }

    this.selectedFile = file;

    const reader = new FileReader();
    reader.onload = (ev: any) => {
      this.preview = ev.target.result;
    };
    reader.readAsDataURL(file);
  }

  submitted = false;
  /* SUBMIT */
  submit() {
    console.log('3333333333333');
    this.submitted = true;
    console.log('22222');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    console.log('ccccccccccc');
    if (!this.preview && !this.isEdit) {
      return;
    }

    console.log('7777777777777777');
    const formData = new FormData();
    console.log('9999999999999');
    Object.keys(this.form.value).forEach(key => {
      if (key != 'deliveryAreas' && key != 'pickupAreas') {
        formData.append(key, this.form.value[key]);
      }

    });
    console.log('qqqqqqqqqqqqqqqqqqqqqq');
    if (this.selectedFile) {
      formData.append("profilePic", this.selectedFile);
    }
    console.log('ccccccccccccccccccccccccccvvvvvvvvvvvvvvvvvvvvv');
    formData.append(
      "deliveryAreas",
      JSON.stringify(this.form.value.deliveryAreas)
    );
    formData.append(
      "pickupAreas",
      JSON.stringify(this.form.value.pickupAreas)
    );
    console.log('kkkkkkkkkkkkkkkkkkk');


    this.isLoading = true;
    console.log('nnnnnnnnnnnnnnnnnnnnnnnn');
    if (this.isEdit) {

      this.api.updateDeliveryBoy(formData, this.id)
        .subscribe((res: any) => {

          this.isLoading = false;

          if (res.status === false) {
            this.common.alertmessage(res.msg, 'Error', 'error');
            return;
          }

          this.router.navigate(['/deliveryboylist']);

        }, err => {
          this.isLoading = false;
        });

    } else {
      console.log('3333333333333');
      this.api.addDeliveryBoy(formData)
        .subscribe((res: any) => {

          this.isLoading = false;

          if (res.status === false) {
            this.common.alertmessage(res.msg, 'Error', 'error');
            return;
          }

          this.router.navigate(['/deliveryboylist']);

        }, err => {
          this.isLoading = false;
        });

    }

  }
}
