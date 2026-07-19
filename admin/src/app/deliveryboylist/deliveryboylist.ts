import { Component } from '@angular/core';
import { ApiService } from '../services/api';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth';
import { CommonModule } from '@angular/common';
import { Common } from '../services/common';
@Component({
  selector: 'app-deliveryboylist',
  imports: [CommonModule, RouterModule],
  templateUrl: './deliveryboylist.html',
  styleUrl: './deliveryboylist.css',
})
export class Deliveryboylist {
  list: any[] = []; isLoading = true;
  constructor(private api: ApiService, public common: Common, private auth: AuthService, private router: Router) {

  }
  ngOnInit() {
    this.auth.isloggedIn() || this.router.navigate(['/login']);
    let session = this.auth.getSession();
    session.userType === 'admin' || this.router.navigate(['/login']);
    this.getAreas();

  }
  deliveryPickupAreas: any = [];
  getAreas() {
    this.isLoading = true;
    this.api.getAreas(this.auth.getAdminId())
      .subscribe((res: any) => {
        this.isLoading = false;
        this.deliveryPickupAreas = res.data;
        this.getList();
      }, err => {
        this.isLoading = false;
        console.error('Error fetching areas:', err);
        this.common.alertmessage('Failed to load areas. Please try again later.', 'Error', 'error');
      });
  }
  getList() {
    this.isLoading = true;
    const adminId = this.auth.getAdminId();

    this.api.getDeliveryBoys(adminId).subscribe((res: any) => {
      this.isLoading = false;
      this.list = res;

      this.list.forEach((boy: any) => {
        // boy.pickupAreas  se id nikal k deliveryPickupAreas se match kr k name nikal lo
        boy.pickupAreas = boy.pickupAreas.map((areaId: string) => {
          const area = this.deliveryPickupAreas.find((a: any) => a._id === areaId);
          return area ? `${area.cityName} - ${area.areaName}` : 'Unknown/Deleted Area';
        });
        // boy.deliveryAreas  se id nikal k deliveryPickupAreas se match kr k name nikal lo
        boy.deliveryAreas = boy.deliveryAreas.map((areaId: string) => {
          const area = this.deliveryPickupAreas.find((a: any) => a._id === areaId);
          return area ? `${area.cityName} - ${area.areaName}` : 'Unknown/Deleted Area';
        });

      });
    });
  }

  changeStatus(id: any, status: boolean) {
    this.isLoading = true;
    this.api.updateDeliveryBoyStatus(id, status).subscribe(() => {
      this.isLoading = false;
      let d = this.list.find(x => x._id == id);
      if (d) d.activeStatus = status;
      this.common.alertmessage('Status updated successfully', 'Success', 'success');
    }, err => {
      this.isLoading = false;
      this.common.alertmessage('Failed to update status', 'Error', 'error');
      console.error("Error deleting store:", err);
    });
  }

  edit(id: any) {
    this.router.navigate(['/adddeliveryboy', id]);
  }

  delete(id: any) {
    if (confirm("Are you sure you want to delete this data ? ")) {
      this.isLoading = true;
      this.api.deleteDeliveryBoy(id).subscribe(() => {
        this.isLoading = false;
        this.common.alertmessage('Delivery boy deleted successfully ', 'Success', 'success');

        this.getList();
      }, err => {
        this.isLoading = false;
        this.common.alertmessage('Failed to delete delivery boy', 'Error', 'error');
        console.error("Error deleting store:", err);
      });
    }
  }
}
