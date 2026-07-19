import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ApiService } from '../services/api';
import { AuthService } from '../services/auth';
import { Common } from '../services/common';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import * as L from 'leaflet';

@Component({
  selector: 'app-add-store',
  imports: [CommonModule, ReactiveFormsModule, RouterModule, FormsModule],
  templateUrl: './addstores.html',
  styleUrls: ['./addstores.css']
})

export class AddStoreComponent implements OnInit {
  map: any;
  marker: any;
  admincity = '';
  adminstate = '';
  searchResults: any[] = [];
  searchTimer: any;
  showMap = false;
  locationDenied = false;
  checkingLocation = true;
  selectedLat: any;
  selectedLng: any;
  storeForm: any;

  selectedImages: any[] = [];

  previewImages: any[] = [];
  previewImages2: any[] = [];

  weekOff: any[] = [];

  weekDays = [
    "Sunday", "Monday", "Tuesday", "Wednesday",
    "Thursday", "Friday", "Saturday"
  ];

  isEdit = false;
  storeId: any = -1;
  isLoading = false;

  icon = L.icon({
    iconUrl: '/leaflet/marker-icon.png',
    iconRetinaUrl: '/leaflet/marker-icon-2x.png',
    shadowUrl: '/leaflet/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
  constructor(private api: ApiService, public common: Common,
    private auth: AuthService,
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.auth.isloggedIn() || this.router.navigate(['/login']);
    let session = this.auth.getSession();
    session.userType === 'admin' || session.userType === 'store' || this.router.navigate(['/login']);
    this.admincity = session.user.city || '';
    this.adminstate = session.user.state || '';
    if (session.userType === 'store' && !session.storeId) {
      this.router.navigate(['/select-store']);
    }
    this.getstoreownerlist();
  }

  usertype: string | null = null;


  checkLocationPermission() {

    if (!navigator.geolocation) {
      this.locationDenied = true;
      this.checkingLocation = false;
      return;
    }

    navigator.geolocation.getCurrentPosition((pos) => {

      this.checkingLocation = false;
      this.locationDenied = false;

    }, (err) => {

      this.checkingLocation = false;
      this.locationDenied = true;

    });

  }
  getCurrentLocation() {

    if (!navigator.geolocation) {
      console.log("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition((position) => {

      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      this.selectedLat = lat;
      this.selectedLng = lng;

      this.storeForm.patchValue({
        latitude: lat,
        longitude: lng
      });

      console.log("Current location:", lat, lng);

    },
      (error) => {
        console.log("Location error", error);
      });

  }

  cityarr: any = [];
  statearr: any = [];
  ngOnInit() {
    //map
    let session = this.auth.getSession();
    this.usertype = session.userType;
    this.checkLocationPermission();
    this.cityarr = [this.admincity];
    this.statearr = [this.adminstate];
    //map
    this.auth.isloggedIn() || this.router.navigate(['/login']);

    session.userType === 'admin' || session.userType === 'store' || this.router.navigate(['/login']);
    this.storeForm = this.fb.group({

      storeName: ['', Validators.required],

      storeType: ['', Validators.required],

      ownerid: ['', Validators.required],



      city: [this.admincity, Validators.required],
      state: [this.adminstate, Validators.required],
      addedBy: [this.auth.getAdminId() || '', Validators.required],
      address: ['', Validators.required],
      address_map: ['', Validators.required],
      landmark: ['', Validators.required],

      openingTime: ['', Validators.required],
      increasepriceby: ['10', Validators.required],
      commissionforadmin: ['10', Validators.required],

      closingTime: ['', Validators.required],

      latitude: ['', Validators.required],

      longitude: ['', Validators.required],
      activeStatus: [true, Validators.required],
      openCloseStatus: ['DefaultOpen', Validators.required],
      ifCloseStatusReason: ['']
    });



    this.route.params.subscribe(p => {

      if (p['id']) {
        this.isEdit = true;
        this.storeId = p['id'];
        this.getStoreDetail();

      } else {
        if (session.userType === 'store') {
          this.router.navigate(['/select-store']);
        } else {
          this.getCurrentLocation();
        }

      }

    });

  }
  storeownerlist: any = [];
  getstoreownerlist() {
    this.isLoading = true;

    const adminId = this.auth.getAdminId();

    this.api.storeownerlist(adminId).subscribe({

      next: (res: any) => {
        this.isLoading = false;
        this.storeownerlist = res.data;
      },
      error: (err) => {
        this.isLoading = false;
        this.common.alertmessage('List load failed ❌', 'error', 'error');
        console.error(err);
      }
    });
  }
  /* IMAGE SELECT */
  imageError: any = '';

  onImageSelect(event: any) {

    this.imageError = '';

    const files = event.target.files;

    if (this.selectedImages.length + files.length > 2) {

      this.imageError = "Maximum 2 images allowed";
      return;

    }

    for (let file of files) {

      if (!file.type.startsWith("image/")) {

        this.imageError = "Only image files allowed";
        return;

      }

      if (file.size > 2 * 1024 * 1024) {

        this.imageError = "Image size must be less than 2MB";
        return;

      }

      this.selectedImages.push(file);

      const reader = new FileReader();

      reader.onload = (e: any) => {

        this.previewImages.push(e.target.result);


      }

      reader.readAsDataURL(file);

    }

  }



  removeImage(i: number) {

    this.selectedImages.splice(i, 1);
    this.previewImages.splice(i, 1);


  }

  removeImage2(i: number) {

    this.previewImages2.splice(i, 1);

  }
  /* WEEKOFF */

  toggleWeekOff(event: any) {

    const value = event.target.value;

    if (event.target.checked) {

      this.weekOff.push(value);

    } else {

      this.weekOff = this.weekOff.filter(v => v !== value);

    }

  }


  /* ADD / UPDATE STORE */

  submitStore() {
    if (this.storeForm.invalid) {

      this.storeForm.markAllAsTouched();

      return;

    }

    if (this.selectedImages.length == 0 && this.previewImages2.length == 0) {

      this.imageError = "Please upload at least one image";
      return;

    }

    const form = this.storeForm.value;

    const formData = new FormData();
    if (form.openingTime >= form.closingTime) {
      this.common.alertmessage('Opening time must be before closing time', 'Error', 'error');
      return;
    }
    if (form.increasepriceby <= 0) {
      this.common.alertmessage('Increase in price % should be more than 0', 'Error', 'error');
      return;
    }
    if (form.commissionforadmin <= 0) {
      this.common.alertmessage('Commission % should be more than 0', 'Error', 'error');
      return;
    }


    formData.append("storeId", form.storeId);
    formData.append("adminId", localStorage.getItem("adminId") || '');

    formData.append("storeName", form.storeName);
    formData.append("storeType", form.storeType);
    formData.append("address", form.address);
    formData.append("address_map", form.address_map);
    formData.append("landmark", form.landmark);

    formData.append("ownerid", form.ownerid);


    formData.append("city", form.city);
    formData.append("state", form.state);

    formData.append("openingTime", form.openingTime);

    formData.append("commissionforadmin", form.commissionforadmin);
    formData.append("increasepriceby", form.increasepriceby);

    formData.append("closingTime", form.closingTime);

    formData.append("latitude", form.latitude);
    formData.append("longitude", form.longitude);

    formData.append("activeStatus", form.activeStatus);
    formData.append("openCloseStatus", form.openCloseStatus);
    formData.append("ifCloseStatusReason", form.ifCloseStatusReason);
    formData.append("addedBy", form.addedBy);


    formData.append("weekOff", JSON.stringify(this.weekOff));
    formData.append(
      "existingImages",
      JSON.stringify(this.previewImages2)
    );
    this.selectedImages.forEach(file => {
      formData.append("images", file);
    });

    this.isLoading = true;

    if (this.isEdit) {

      this.api.updatestore(formData, this.storeId)
        .subscribe((res: any) => {
          this.isLoading = false;
          if (res.status === false) {
            this.isLoading = false;
            this.common.alertmessage(res.msg, 'Error', 'error');
            return;
          }
          if (this.usertype === 'admin') {
            this.router.navigate(['/storelist']);
          } else {
            this.common.alertmessage('Store updated successfully', 'Success', 'success');
          }

        }, err => {
          this.isLoading = false;
          this.common.alertmessage('Failed to update store', 'Error', 'error');
          console.error("Error updating store:", err);
        });

    } else {

      this.api.savestore(formData)
        .subscribe((res: any) => {
          if (res.status === false) {
            this.isLoading = false;
            this.common.alertmessage(res.msg, 'Error', 'error');
            return;
          }
          this.router.navigate(['/storelist']);
        }, err => {
          this.isLoading = false;
          this.common.alertmessage('Failed to save store', 'Error', 'error');
          console.error("Error saving store:", err);
        });

    }

  }


  /* GET STORE DETAIL */

  getStoreDetail() {
    this.isLoading = true;

    this.api.getStoreDetail(this.storeId)
      .subscribe((data: any) => {
        let res = data.data;
        this.isLoading = false;
        this.storeForm.patchValue({

          storeId: res.storeId,
          storeName: res.storeName,
          address: res.address, address_map: res.address_map,
          storeType: res.storeType,
          ownerid: res.ownerid._id, landmark: res.landmark,

          city: res.city,
          state: res.state,
          openingTime: res.openingTime,
          increasepriceby: res.increasepriceby, commissionforadmin: res.commissionforadmin,



          closingTime: res.closingTime,
          latitude: res.location?.coordinates[1],
          longitude: res.location?.coordinates[0],
          activeStatus: res.activeStatus,
          openCloseStatus: res.openCloseStatus,
          ifCloseStatusReason: res.ifCloseStatusReason,

        });


        this.weekOff = [];

        if (res.weekOff && res.weekOff.length) {

          try {

            const parsed = JSON.parse(res.weekOff[0]);

            this.weekOff.push(...parsed);

          } catch (e) {

            this.weekOff = res.weekOff;

          }

        }

        /* IMAGES */


        if (res.images) {

          this.previewImages2 = res.images.map((img: any) => img);

        }

      }, err => {
        this.isLoading = false;
        this.common.alertmessage('Failed to fetch store details', 'Error', 'error');
        console.error("Error fetching store details:", err);
      }
      );

  }
  openMapPopup() {

    this.showMap = true;

    setTimeout(() => {

      this.map = L.map('map').setView([28.6139, 77.2090], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: 'OSM'
      }).addTo(this.map);

      const lat = this.storeForm.value.latitude;
      const lng = this.storeForm.value.longitude;

      if (lat && lng) {

        this.marker = L.marker(
          [lat, lng],
          {
            icon: this.icon,
            draggable: true
          }
        ).addTo(this.map);

        this.map.setView([lat, lng], 15);

      }

      this.map.on('click', (e: any) => {

        if (this.marker) {
          this.map.removeLayer(this.marker);
        }

        this.marker = L.marker(
          [e.latlng.lat, e.latlng.lng],
          {
            icon: this.icon,
            draggable: true
          }
        ).addTo(this.map);

        this.selectedLat = e.latlng.lat;
        this.selectedLng = e.latlng.lng;

        this.getAddressFromLatLng(this.selectedLat, this.selectedLng);

        this.marker.on('dragend', () => {

          let pos = this.marker.getLatLng();

          this.selectedLat = pos.lat;
          this.selectedLng = pos.lng;

          this.getAddressFromLatLng(pos.lat, pos.lng);

        });

      });

    }, 200)

  }
  useCurrentLocation() {

    if (!navigator.geolocation) {

      alert("Geolocation not supported");

      return;

    }

    navigator.geolocation.getCurrentPosition((position) => {

      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      this.selectedLat = lat;
      this.selectedLng = lng;
      this.getAddressFromLatLng(lat, lng);
      if (this.marker) {
        this.map.removeLayer(this.marker);
      }

      this.marker = L.marker([lat, lng], {
        icon: this.icon,
        draggable: true
      }).addTo(this.map);
      this.marker.on('dragend', () => {

        let pos = this.marker.getLatLng();

        this.selectedLat = pos.lat;
        this.selectedLng = pos.lng;

        this.getAddressFromLatLng(pos.lat, pos.lng);

      });
      this.map.setView([lat, lng], 15);

      this.storeForm.patchValue({
        latitude: lat,
        longitude: lng
      });

    }, (error) => {

      console.log(error);

      alert("Unable to fetch location");

    });

  }
  searchQueryInput: any = '';
  getAddressFromLatLng(lat: any, lng: any) {

    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)

      .then(res => res.json())

      .then(data => {

        if (data && data.display_name) {

          this.searchQueryInput = data.display_name;
          this.storeForm.patchValue({
            address_map: data.display_name
          });

        }

      })

      .catch(err => {
        console.log(err);
      });

  }
  selectLocation(place: any) {

    let lat = place.lat;
    let lon = place.lon;

    this.map.setView([lat, lon], 15);

    if (this.marker) {
      this.map.removeLayer(this.marker);
    }

    this.marker = L.marker([lat, lon], {
      icon: this.icon,
      draggable: true
    }).addTo(this.map);

    this.marker.on('dragend', () => {

      let pos = this.marker.getLatLng();

      this.selectedLat = pos.lat;
      this.selectedLng = pos.lng;

      this.getAddressFromLatLng(pos.lat, pos.lng);

    });
    this.selectedLat = lat;
    this.selectedLng = lon;

    this.searchResults = [];

  }
  confirmLocation() {
    this.storeForm.patchValue({
      latitude: this.selectedLat,
      longitude: this.selectedLng
    });

    this.showMap = false;

  }
  closePopup() {

    this.showMap = false;

    if (this.map) {
      this.map.remove();
      this.map = null;
    }

  }
  onSearchChange(event: any) {

    let query = event.target.value;

    clearTimeout(this.searchTimer);

    this.searchTimer = setTimeout(() => {

      this.searchLocation(query);

    }, 700); // 700ms delay

  }
  searchLocation(query: any) {

    if (query.length < 3) {
      this.searchResults = [];
      return;
    }

    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`)
      .then(res => res.json())
      .then(data => {
        this.searchResults = data;
      })
      .catch(err => {
        console.log(err);
      });

  }
}