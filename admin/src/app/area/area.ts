
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
  selector: 'app-area',
  imports: [CommonModule, ReactiveFormsModule, RouterModule, FormsModule],
  templateUrl: './area.html',
  styleUrl: './area.css',
})

export class Area {

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



  }
  areas: any[] = [];
  loading = false;
  errorMsg = '';
  isEdit = false;
  selectedId: string = '';

  adminId = localStorage.getItem('adminId'); // 👈 adjust if needed
  form: any;
 reload(){
       

    this.getAreas();
  }


  ngOnInit() {
   
    let cityName = this.auth.getSession().user?.city || '';
    this.form = this.fb.group({
      cityName: [cityName, Validators.required],
      areaName: ['', Validators.required],
          polygoncordinates: ['', Validators.required]

    });
    this.getAreas();
  }

  // ============================
  // GET LIST
  // ============================
  getAreas() {
    this.loading = true;
    this.api.getAreas(this.adminId)
      .subscribe((res: any) => {
        this.loading = false;
        this.areas = res.data;
      }, err => {
        this.loading = false;
        console.error('Error fetching areas:', err);
        this.common.alertmessage('Failed to load areas. Please try again later.', 'Error', 'error');
      });
  }

  // ============================
  // ADD / UPDATE
  // ============================
  submit() {

    if (this.form.invalid) return;

    this.loading = true;
    this.errorMsg = '';
  let polygoncordinates: any[];
 try {

    polygoncordinates = JSON.parse(
      this.form.value.polygoncordinates
    );

    // Check array
    if (!Array.isArray(polygoncordinates)) {
      throw new Error('Polygon coordinates must be an array');
    }

    // Minimum 3 points
    if (polygoncordinates.length < 3) {
      throw new Error('Polygon must have at least 3 coordinates');
    }

    // Validate every coordinate
    const isValid = polygoncordinates.every((point: any) =>
      point &&
      typeof point.lat === 'number' &&
      typeof point.lng === 'number'
    );

    if (!isValid) {
      throw new Error(
        'Every coordinate must have numeric lat and lng'
      );
    }

  } catch (error: any) {

    this.loading = false;

    this.errorMsg =
      'Invalid polygon coordinates JSON. Please check the format.';

    return;
  }
    const payload = {
      ...this.form.value,    polygoncordinates: polygoncordinates,

      adminId: this.adminId
    };

    if (this.isEdit) {

      // UPDATE
      this.api.submitArea(payload, true, this.selectedId)
        .subscribe({
          next: () => {
            this.afterSave();
          },
          error: (err) => {
            this.handleError(err);
          }
        });

    } else {

      // CREATE
      this.api.submitArea(payload, false, '')
        .subscribe({
          next: () => {
            this.afterSave();
          },
          error: (err) => {
            this.handleError(err);
          }
        });
    }
  }

  // ============================
  // EDIT
  // ============================
  edit(item: any) {
    this.isEdit = true;
    this.selectedId = item._id;

    this.form.patchValue({
      cityName: item.cityName,
      areaName: item.areaName,
       polygoncordinates: JSON.stringify(
      item.polygoncordinates || [],
      null,
      2
    )
    });
  }

  // ============================
  // DELETE
  // ============================
  delete(id: string) {

    if (!confirm('Delete this area?')) return;
    this.loading = true;
    this.api.deleteArea(id)
      .subscribe(() => {
        this.common.alertmessage('Area deleted successfully', 'Success', 'success');
        this.getAreas();
      }, err => {
        this.loading = false;
        console.error('Error deleting area:', err);
        this.common.alertmessage('Failed to delete area. Please try again later.', 'Error', 'error');
      });
  }

  // ============================
  // RESET AFTER SAVE
  // ============================
  afterSave() {
    this.loading = false;
    this.form.reset();
    this.isEdit = false;
    this.selectedId = '';
    this.getAreas();
  }

  // ============================
  // ERROR HANDLE
  // ============================
  handleError(err: any) {
    this.loading = false;
    this.errorMsg = err.error?.message || 'Error occurred';
  }

}