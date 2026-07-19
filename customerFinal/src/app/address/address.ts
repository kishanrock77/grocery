import {
  Component,
  Input,
  OnDestroy,
  OnInit
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  Validators
} from '@angular/forms';

import {
  Router,
  RouterModule
} from '@angular/router';

import {
  HttpClient
} from '@angular/common/http';

import { Subscription } from 'rxjs';

import * as L from 'leaflet';

import { Common } from '../services/common';
import { AuthService } from '../services/auth';
import { ApiService } from '../services/api';
import { WishlistService } from '../services/wishlist';
import { PopupService } from '../services/popup';

@Component({
  selector: 'app-address',
  standalone: true,
  templateUrl: './address.html',
  styleUrls: ['./address.css'],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ReactiveFormsModule
  ]
})

export class Address implements OnInit, OnDestroy {
  locationSelected = false;
  constructor(

    public common: Common,

    private auth: AuthService,

    private api: ApiService,

    private http: HttpClient,

    public popupService: PopupService,

    private wishlistService: WishlistService,

    private fb: FormBuilder,

    private router: Router

  ) { }
  // TS
  clearSearch() {

    this.searchQueryInput = '';

    this.searchResults = [];

  }
  isEditAddress = false;

  editIndex: any = null;
  addresses: any[] = [];

  selectedAddress: any = null;

  loading = false;

  showAddForm = false;

  cities: any[] = [];

  adminAreaIds: any[] = [];

  states = ['Uttar Pradesh'];

  addressForm: any;

  areas: any[] = [];

  showMap = false;

  map: any;

  marker: any;

  selectedLat: any;

  selectedLng: any;

  searchResults: any[] = [];

  searchQueryInput = '';
  @Input() comingfromwhichpage: any = '';
  searchTimer: any;

  areasSubscription?: Subscription;
  deleteAddressSubscription?: Subscription;
  saveAddressSubscription?: Subscription;

  icon = L.icon({
    iconUrl: '/leaflet/marker-icon.png',
    iconRetinaUrl: '/leaflet/marker-icon-2x.png',
    shadowUrl: '/leaflet/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
  });

  ngOnInit(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
    this.addressForm = this.fb.group({

      contactName: ['', Validators.required],

      contactMobile: [
        '',
        [
          Validators.required,
          Validators.pattern(/^[0-9]{10}$/)
        ]
      ],

      fullAddress: ['', Validators.required],

      mapAddress: ['', Validators.required],



      city: ['', Validators.required],

      state: ['Uttar Pradesh', Validators.required],

      pincode: [
        '',
        [
          Validators.required,
          Validators.pattern(/^[0-9]{6}$/)
        ]
      ],

      landmark: ['', Validators.required],

      latitude: ['', Validators.required],

      longitude: ['', Validators.required],

      label: ['home', Validators.required]

    });

    this.getAreas();

    this.loadAddresses();

  }

  ngOnDestroy(): void {
    this.areasSubscription?.unsubscribe();
    this.deleteAddressSubscription?.unsubscribe();
    this.saveAddressSubscription?.unsubscribe();
  }

  // EDIT ADDRESS

  editAddress(address: any, index: any) {

    this.isEditAddress = true;

    this.editIndex = index;

    this.showAddForm = true;

    this.addressForm.patchValue({

      contactName: address.contactName,

      contactMobile: address.contactMobile,

      fullAddress: address.fullAddress,

      mapAddress: address.mapAddress,

      city: address.city,

      state: address.state,

      pincode: address.pincode,

      landmark: address.landmark,

      label: address.label,

      latitude: address.latitude,

      longitude: address.longitude

    });

  }
  loadAddresses() {

    const user = JSON.parse(
      localStorage.getItem('user') || '{}'
    );

    this.addresses = user.address || [];
    this.addresses.forEach((address: any) => {

      const areaObj =
        this.areas.find(
          (x: any) => x._id == address.city
        );
      if (areaObj) {
        address.cityName = areaObj.cityName;
      }
    });
    if (this.common.selectedaddress) {

      this.selectedAddress = this.common.selectedaddress;

    }

  }

  getAreas() {

    this.loading = true;

    this.areasSubscription?.unsubscribe();

    this.areasSubscription = this.api.getAreas().subscribe((res: any) => {

      this.loading = false;

      if (res.success) {

        this.areas = res.areas;

        this.cities = res.areas;

        this.addresses.forEach((address: any) => {

          const areaObj =
            this.areas.find(
              (x: any) => x._id == address.city
            );
          if (areaObj) {
            address.cityName = areaObj.cityName;
          }
        });
        const adminId =
          localStorage.getItem("adminId");

        this.adminAreaIds = this.areas
          .filter((x: any) =>
            x.adminId == adminId
          )
          .map((x: any) => x._id);

      } else {

        this.common.alertmessage(
          'Failed to load areas',
          'Error',
          'error'
        );

      }

    }, err => {

      this.loading = false;

      this.common.alertmessage(
        'Failed to load areas',
        'Error',
        'error'
      );

    });

  }
  // DELETE ADDRESS
  async deleteAddress(address: any, index: any) {

    const confirmed =
      await this.common.confirmopen(
        'Are you sure you want to delete this address?'
      );

    if (!confirmed) {
      return;
    }

    const body = {

      customerId:
        JSON.parse(
          localStorage.getItem('user') || '{}'
        )._id,

      index

    };

    this.loading = true;

    this.deleteAddressSubscription?.unsubscribe();

    this.deleteAddressSubscription = this.api
      .deleteCustomerAddress(body)
      .subscribe((res: any) => {

        this.loading = false;

        if (res.success) {

          /* REMOVE SELECTED ADDRESS */

          if (

            this.selectedAddress &&

            this.selectedAddress.fullAddress ==
            address.fullAddress

          ) {

            this.selectedAddress = null;

            this.common.selectedaddress = '';

            localStorage.removeItem(
              'selectedAddress'
            );
            localStorage.setItem(
              'selectedAddress',
              JSON.stringify(this.selectedAddress)
            );

            this.common.selectedaddress =
              this.selectedAddress;

            this.common.selectedAddressUpdated.next(
              this.selectedAddress
            );
          }

          /* UPDATE USER */

          localStorage.setItem(
            'user',
            JSON.stringify(res.user)
          );

          /* REFRESH */

          this.loadAddresses();

          this.common.alertmessage(
            'Address deleted successfully',
            'Success',
            'success'
          );

        } else {

          this.common.alertmessage(
            res.msg || 'Delete failed',
            'Error',
            'error'
          );

        }

      }, (err: any) => {

        this.loading = false;

        this.common.alertmessage(
          'Delete failed',
          'Error',
          'error'
        );

      });

  }

  selectAddress(address: any, index: any) {

    if (
      this.selectedAddress &&
      this.selectedAddress.index ==
      index
    ) {

      this.selectedAddress = null;

      this.common.selectedaddress = '';



    } else {
      this.selectedAddress = address;
      this.selectedAddress.index = index;
    }




    localStorage.setItem(
      'selectedAddress',
      JSON.stringify(this.selectedAddress)
    );

    this.common.selectedaddress =
      this.selectedAddress;

    this.common.selectedAddressUpdated.next(
      this.selectedAddress
    );


  }

  async nextme(afteredit = false) {

    if (afteredit == false) {
      if (!this.selectedAddress) {
        return;
      }
    }

    console.log(this.selectedAddress)
    localStorage.setItem(
      'selectedAddress',
      JSON.stringify(this.selectedAddress)
    );
    console.log("this.selectedAddress", this.selectedAddress)
    this.common.selectedaddress =
      this.selectedAddress;

    this.common.selectedAddressUpdated.next(
      this.selectedAddress
    ); console.log("this.selectedAddres 2s", this.selectedAddress)
    const cityId = this.selectedAddress?.city || -1;

    const isAdminArea =
      this.adminAreaIds.includes(cityId);

    if (isAdminArea) {

      this.popupService.close();
      if (this.comingfromwhichpage == 'cart') {
        this.router.navigate(['/cart/-1']);
      } else if (this.comingfromwhichpage == 'accounts') {
        this.router.navigate(['/accounts']);
      } else if (this.comingfromwhichpage == 'nowhere') {
        // do nothing
      }
      return;

    }
    if (cityId != -1) {
      const areaObj =
        this.areas.find(
          (x: any) => x._id == cityId
        );

      const confirmChange = await this.common.confirmopen(
        `Agar aap ${areaObj?.cityName} address select karte h to apko dubara items select karne padenge. Continue?`
      );

      if (!confirmChange) {
        return;
      }

      this.handleAreaChange(areaObj);
    }

  }

  handleAreaChange(areaObj: any) {

    /* OLD AREA */

    const oldSelectedArea =
      JSON.parse(
        localStorage.getItem('selectedArea') || '{}'
      );

    /* =========================
       CART
    ========================= */

    const oldCart = JSON.parse(
      localStorage.getItem('cart') || '[]'
    );

    const cartByArea = JSON.parse(
      localStorage.getItem('cartByArea') || '{}'
    );

    /* SAVE OLD AREA CART */

    if (oldSelectedArea?._id) {

      cartByArea[
        oldSelectedArea._id
      ] = oldCart;

    }

    localStorage.setItem(
      'cartByArea',
      JSON.stringify(cartByArea)
    );

    /* LOAD NEW AREA CART */

    const newCart =
      cartByArea[areaObj._id] || [];

    // 🔥 REALTIME UPDATE
    this.common.setCart(newCart);

    /* =========================
       WISHLIST
    ========================= */

    const wishlist = JSON.parse(
      localStorage.getItem('wishlist') || '[]'
    );

    const wishlistByArea = JSON.parse(
      localStorage.getItem('wishlistByArea') || '{}'
    );

    /* SAVE OLD AREA WISHLIST */

    if (oldSelectedArea?._id) {

      wishlistByArea[
        oldSelectedArea._id
      ] = wishlist;

    }

    localStorage.setItem(
      'wishlistByArea',
      JSON.stringify(wishlistByArea)
    );

    /* LOAD NEW AREA WISHLIST */

    const newWishlist =
      wishlistByArea[areaObj._id] || [];

    // 🔥 REALTIME UPDATE
    this.wishlistService.setWishlist(
      newWishlist
    );
    /* =========================
       SELECTED ADDRESS
    ========================= */

    const selectedAddress = JSON.parse(
      localStorage.getItem('selectedAddress') || 'null'
    );

    const addressByArea = JSON.parse(
      localStorage.getItem('addressByArea') || '{}'
    );

    /* SAVE OLD AREA ADDRESS */

    if (oldSelectedArea?._id) {

      addressByArea[
        oldSelectedArea._id
      ] = selectedAddress;

    }

    localStorage.setItem(
      'addressByArea',
      JSON.stringify(addressByArea)
    );

    /* LOAD NEW AREA ADDRESS */

    const newSelectedAddress =
      addressByArea[areaObj._id] || null;

    /* REALTIME UPDATE */

    this.common.selectedaddress =
      newSelectedAddress;

    /* LOCALSTORAGE UPDATE */

    if (newSelectedAddress) {

      localStorage.setItem(
        'selectedAddress',
        JSON.stringify(newSelectedAddress)
      );

    } else {

      localStorage.removeItem(
        'selectedAddress'
      );

    }
    /* =========================
       BROWSED ITEMS
    ========================= */

    const browsed = JSON.parse(
      localStorage.getItem('bowseditemarr') || '[]'
    );

    const browsedByArea = JSON.parse(
      localStorage.getItem('browsedByArea') || '{}'
    );

    /* SAVE OLD AREA BROWSED */

    if (oldSelectedArea?._id) {

      browsedByArea[
        oldSelectedArea._id
      ] = browsed;

    }

    localStorage.setItem(
      'browsedByArea',
      JSON.stringify(browsedByArea)
    );

    /* LOAD NEW AREA BROWSED */

    const newBrowsed =
      browsedByArea[areaObj._id] || [];

    localStorage.setItem(
      'bowseditemarr',
      JSON.stringify(newBrowsed)
    );

    /* =========================
       FINAL UPDATE
    ========================= */

    localStorage.setItem(
      'selectedArea',
      JSON.stringify(areaObj)
    );

    localStorage.setItem(
      'adminId',
      areaObj.adminId
    );

    this.popupService.stack = [];


    setTimeout(() => {

      this.router.navigate(['/select-area/address']);

    }, 50);

  }

  // SAVE ADDRESS

  saveAddress() {

    if (this.addressForm.invalid) {

      this.addressForm.markAllAsTouched();

      return;

    }

    const formData =
      this.addressForm.value;

    const body = {

      customerId:
        JSON.parse(
          localStorage.getItem('user') || '{}'
        )._id,

      address: formData,

      isEdit: this.isEditAddress,

      editIndex: this.editIndex

    };

    this.loading = true;

    this.saveAddressSubscription?.unsubscribe();

    this.saveAddressSubscription = this.api
      .addCustomerAddress(body)
      .subscribe((res: any) => {

        this.loading = false;

        if (res.success) {

          localStorage.setItem(
            'user',
            JSON.stringify(res.user)
          );

          this.loadAddresses();

          /* UNSELECT IF EDITED ADDRESS WAS SELECTED */

          if (

            this.selectedAddress &&

            this.editIndex != null &&

            this.selectedAddress.fullAddress ==
            res.updatedAddress?.oldFullAddress

          ) {

            this.selectedAddress = null;

            this.common.selectedaddress = '';
            this.common.selectedAddressUpdated.next(
              this.selectedAddress
            );

            localStorage.setItem(
              'selectedAddress',
              JSON.stringify(this.selectedAddress)
            );



            this.nextme(true);

          }

          this.showAddForm = false;

          this.isEditAddress = false;

          this.editIndex = null;

          this.resetform();

          this.common.alertmessage(
            res.msg,
            'Success',
            'success'
          );

        } else {

          this.common.alertmessage(
            res.msg,
            'Error',
            'error'
          );

        }

      }, err => {

        this.loading = false;

        this.common.alertmessage(
          'Failed',
          'Error',
          'error'
        );

      });

  }

  resetform() {
    this.addressForm.reset({

      state: 'Uttar Pradesh',

      label: 'home'

    });

    this.isEditAddress = false;

    this.editIndex = null;
  }

  openMapPopup() {

    this.showMap = true;

    /* RESET */

    this.locationSelected = false;

    this.searchQueryInput = '';

    this.searchResults = [];

    this.selectedLat = null;

    this.selectedLng = null;

    setTimeout(() => {
      if (this.map) {

        this.map.off();

        this.map.remove();

        this.map = null;

      }

      const oldContainer =
        L.DomUtil.get('map');

      if (oldContainer) {

        // @ts-ignore
        oldContainer._leaflet_id = null;

      }
      this.map = L.map('map')
        .setView([28.6139, 77.2090], 13);

      L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          attribution: 'OSM'
        }
      ).addTo(this.map);

      this.map.on('click', (e: any) => {

        this.locationSelected = true;

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

        this.selectedLat =
          e.latlng.lat;

        this.selectedLng =
          e.latlng.lng;

        this.getAddressFromLatLng(
          this.selectedLat,
          this.selectedLng
        );

      });

    }, 300);

  }
  useCurrentLocation() {

    if (!navigator.geolocation) {

      this.common.alertmessage(
        'Geolocation not supported',
        'Error',
        'error'
      );

      return;

    }

    /* START LOADER */

    this.loading = true;

    navigator.geolocation.getCurrentPosition(

      (position) => {

        const lat =
          position.coords.latitude;

        const lng =
          position.coords.longitude;

        this.selectedLat = lat;

        this.selectedLng = lng;

        this.locationSelected = true;

        this.getAddressFromLatLng(
          lat,
          lng
        );

        if (this.marker) {

          this.map.removeLayer(
            this.marker
          );

        }

        this.marker = L.marker(
          [lat, lng],
          {
            icon: this.icon,
            draggable: true
          }
        ).addTo(this.map);

        this.map.setView(
          [lat, lng],
          16
        );

        /* STOP LOADER */

        this.loading = false;

      },

      (error) => {

        /* STOP LOADER */

        this.loading = false;
        let msg = '';
        if (error.code === 1) {

          // msg ='Location permission denied';


          this.douserCurrentLocationwithlatlongfromapp();

        } else {
          msg =
            'Unable to fetch location';



          if (error.code === 2) {

            msg =
              'Location unavailable';

          }

          if (error.code === 3) {

            msg =
              'Location request timeout';

          }

          this.common.alertmessage(
            msg,
            'Error',
            'error'
          );

        }

      },

      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0
      }

    );

  }

  douserCurrentLocationwithlatlongfromapp() {

    this.common.alertmessage(
      'Trying alternate method to fetch location.',
      'info',
      'info'
    );
    const lat = localStorage.getItem('lat_from_app');
    const lng = localStorage.getItem('lng_from_app');
    const address = localStorage.getItem('address_from_app');
    if (lat && lng) {
      this.selectedLat = parseFloat(lat);
      this.selectedLng = parseFloat(lng);
      this.locationSelected = true;
      if (address) {
        this.searchQueryInput = address;
      }
      if (this.marker) {

        this.map.removeLayer(
          this.marker
        );
      }
      this.marker = L.marker(
        [this.selectedLat, this.selectedLng],
        {
          icon: this.icon,
          draggable: true
        }
      ).addTo(this.map);
      this.map.setView(
        [this.selectedLat, this.selectedLng],
        16
      );
    } else {
      this.common.alertmessage(
        'Unable to fetch location from app',
        'Error',
        'error'
      );
    }

  }

  getAddressFromLatLng(
    lat: any,
    lng: any
  ) {

    fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
    )

      .then(res => res.json())

      .then(data => {

        this.searchQueryInput =
          data.display_name || '';

      })

      .catch(() => {

        this.common.alertmessage(
          'Failed to fetch address',
          'Error',
          'error'
        );

      });

  }

  onSearchChange(event: any) {

    const query =
      event.target.value;

    clearTimeout(this.searchTimer);

    this.searchTimer =
      setTimeout(() => {

        this.searchLocation(query);

      }, 700);

  }

  searchLocation(query: any) {

    if (query.length < 3) {

      this.searchResults = [];

      return;

    }

    fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${query}`
    )

      .then(res => res.json())

      .then(data => {

        this.searchResults = data;

      });

  }

  selectLocation(place: any) {

    const lat = place.lat;

    const lon = place.lon;

    this.selectedLat = lat;

    this.selectedLng = lon;

    this.locationSelected = true;

    this.searchQueryInput =
      place.display_name;

    this.map.setView(
      [lat, lon],
      15
    );

    if (this.marker) {

      this.map.removeLayer(
        this.marker
      );

    }

    this.marker = L.marker(
      [lat, lon],
      {
        icon: this.icon,
        draggable: true
      }
    ).addTo(this.map);

    this.searchResults = [];

  }

  confirmLocation() {

    if (!this.locationSelected) {

      return;

    }

    this.addressForm.patchValue({

      mapAddress:
        this.searchQueryInput,

      latitude:
        this.selectedLat,

      longitude:
        this.selectedLng

    });

    this.showMap = false;

    this.searchQueryInput = '';

    this.searchResults = [];

    this.locationSelected = false;

    if (this.map) {

      this.map.off();

      this.map.remove();

      this.map = null;

    }

    const oldContainer =
      L.DomUtil.get('map');

    if (oldContainer) {

      // @ts-ignore
      oldContainer._leaflet_id = null;

    }

  }

  closePopup() {

    this.showMap = false;

    this.searchQueryInput = '';

    this.searchResults = [];

    this.locationSelected = false;

    this.selectedLat = null;

    this.selectedLng = null;

    if (this.map) {

      this.map.off();

      this.map.remove();

      this.map = null;

    }

    const oldContainer =
      L.DomUtil.get('map');

    if (oldContainer) {

      // @ts-ignore
      oldContainer._leaflet_id = null;

    }

  }


  closePage() {

    this.popupService.close();

  }

}