// api.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  websuburi: string = environment.websuburi;
  weburi: string = environment.weburi;
  uri: string = environment.commonURL;
  brandname: string = environment.brandname;
  constructor(private http: HttpClient) {


  }
  baseUrl = this.uri + "api";
  updateStoreStatus(id: any, status: any, col: any) {
    return this.http.put(this.uri + 'api/store/status/' + id, {
      status: status,
      col: col
    });
  }
  updateDStatus(id: any, status: any, col: any) {
    return this.http.put(this.uri + 'api/deliveryboy/status/' + id, {
      status: status,
      col: col
    });
  }
  getStoreDetail(id: any) {

    return this.http.get(
      this.uri + "api/store/detail/" + id
    );

  }
  customorderlist(adminId:any,customerId: any,usertype:any) {

    return this.http.post(this.uri + "api/order/customorderlist", {adminId,customerId,usertype})

  }
updateDLocation(data: any) {
  return this.http.post(
    `${this.uri}api/deliveryboy/update-location`,
    data
  );
}
  savestore(data: any) {
    console.log("Saving store with data:", data);
    return this.http.post(this.uri + "api/store/add", data);
  }
  updatestore(data: any, storeId: any) {

    return this.http.put(this.uri + "api/store/update/" + storeId, data);
  }
  getStores(adminId: any) {

    return this.http.post(this.uri + "api/store/list", {
      adminId: adminId
    })

  }
  saveAdminreplyforcustomorder(data:any){
 return this.http.post(this.uri + "api/order/saveAdminreplyforcustomorder", data);
  }

 addbanner(data:any){
 return this.http.post(this.uri + "api/banner/addbanner", data);
  }
getListbanner(data:any){
 return this.http.post(this.uri + "api/banner/getListbanner", data);
  }
deletebanner(id:any){
 return this.http.get(this.uri + "api/banner/deletebanner/"+id);
  }
  
  loadCustomers(daa:any){
     return this.http.post(this.uri + "api/customer/customer-list", daa);
  }
  loadstoresforstoreowner(ownerId: any) {

    return this.http.post(this.uri + "api/store/list-for-storeowner", {

      storeOwnerId: ownerId
    });
  }
  deleteStore(storeid: any) {

    return this.http.delete(this.uri + "api/store/delete/" + storeid);
  }
  getDeliveryBoyDetail(id: any) {
    return this.http.get(this.baseUrl + '/deliveryboy/detail/' + id);
  }

  addDeliveryBoy(data: any) {
    return this.http.post(this.baseUrl + '/deliveryboy/add', data);
  }

  updateDeliveryBoy(data: any, id: any) {
    return this.http.put(this.baseUrl + '/deliveryboy/update/' + id, data);
  }

  getDeliveryBoys(adminId: any) {

    return this.http.post(this.uri + "api/deliveryboy/list", {
      adminId: adminId
    })

  }

  updateDeliveryBoyStatus(id: any, activeStatus: any) {
    return this.http.put(this.baseUrl + '/deliveryboy/activeStatus/' + id, { activeStatus });
  }

  deleteDeliveryBoy(id: any) {
    return this.http.delete(this.baseUrl + '/deliveryboy/delete/' + id);
  }




  storeowneradd(data: any) {
    return this.http.post(this.baseUrl + '/store-owner/add', data);
  }

  storeownerlist(adminId: any) {
    return this.http.post(this.baseUrl + '/store-owner/list', {
      adminId: adminId
    });
  }

  storeownerupdate(id: any, data: any) {
    return this.http.put(this.baseUrl + '/store-owner/update/' + id, data);
  }
  storeownerdelete(id: any) {
    return this.http.delete(this.baseUrl + '/store-owner/delete/' + id);
  }
  loadCategories(adminId: any) {
    return this.http.get(this.baseUrl + '/category/list/' + adminId);
  }
  savecategory(data: any, editid: any) {
    if (editid) {
      return this.http.put(this.baseUrl + '/category/update/' + editid, data);
    } else {
      return this.http.post(this.baseUrl + '/category/add', data);
    }

  }
  deleteCategories(id: any) {
    return this.http.delete(this.baseUrl + '/category/delete/' + id);
  }
  emptydb(table:any) {
    return this.http.delete<any>(this.baseUrl + '/category/emptydb/'+table);
  }

  addItem(data: FormData, itemId: any) {
    if (itemId) {
      return this.http.put(`${this.baseUrl}/item/update/${itemId}`, data);
    }
    return this.http.post(`${this.baseUrl}/item/add`, data);
  }



  getItemDetail(id: string) {
    return this.http.get(`${this.baseUrl}/item/detail/${id}`);
  }

  getChildItems(selectedCategories: string[], userType: any, adminId: any, storeId: any) {
    return this.http.post(`${this.baseUrl}/item/child-items`, {
      selectedCategories: selectedCategories,
      userType: userType,
      adminId: adminId,
      storeId: storeId
    });
  }
  getAddonItems(selectedCategories: string[], userType: any, adminId: any, storeId: any) {
    return this.http.post(`${this.baseUrl}/item/addon-items`, {
      selectedCategories: selectedCategories,
      userType: userType,
      adminId: adminId,
      storeId: storeId
    });
  }
  getItemList(payload: any) {
    return this.http.post(`${this.baseUrl}/item/list`, payload);
  }

  deleteItem(id: string) {
    return this.http.delete(`${this.baseUrl}/item/delete/${id}`);
  }
  deleteItemAll() {
    return this.http.delete(`${this.baseUrl}/item/deleteAll`);
  }
  getGeneralItems(categoryId: string, adminId: string) {
    return this.http.get(
      `${this.baseUrl}/item/general-items/${categoryId}/${adminId}`
    );
  }

  getStoreItems(storeId: string) {
    return this.http.get(
      `${this.baseUrl}/item/store-items/${storeId}`
    );
  }

  mapItems(payload: any) {
    return this.http.post(`${this.baseUrl}/item/map-items`, payload);
  }

  updateShowOnFront(data: any): Observable<any> {
    return this.http.put(
      `${this.baseUrl}/item/update-show-on-front`,
      data
    );
  }

  getAreas(adminId: any) {
    return this.http.get(this.baseUrl + '/delivery-area/list?adminId=' + adminId);
  }
  submitArea(data: any, isEdit: boolean, selectedId: string) {
    if (isEdit) {
      return this.http.put(this.baseUrl + '/delivery-area/update/' + selectedId, data);
    } else {
      return this.http.post(this.baseUrl + '/delivery-area/create', data);
    }
  }
  deleteArea(id: string) {
    return this.http.delete(this.baseUrl + '/delivery-area/delete/' + id);
  }

}