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
  getAreas(): Observable<any> {
    return this.http.get(this.baseUrl + '/customer/areas');
  }
  customorder(data: any) {

    return this.http.post(this.uri + "api/order/createcustomorder", data)

  }
  customorderlist(adminId:any,customerId: any,usertype:any) {

    return this.http.post(this.uri + "api/order/customorderlist", {adminId,customerId,usertype})

  }
  actionbycustomerforcustomorder(data:any){
      return this.http.post(this.uri + "api/order/actionbycustomerforcustomorder", data)

  }
  createnewitemwhencustomapprovecustoorder(data:any){
      return this.http.post(this.uri + "api/order/createnewitemwhencustomapprovecustoorder", data)

  }
 changepaymentmethodtocod(_id: any) {

    return this.http.post(this.uri + "api/order/change-payment-method-to-cod", {_id})

  }
  
  getStores(adminId: any) {

    return this.http.post(this.uri + "api/store/listforcustomer", {
      adminId: adminId
    })

  }
  // API SERVICE
 ceatebackendorderforazorpay(orderId: any,customerid: any, amount: any) {
    return this.http.post (this.baseUrl + '/order/ceatebackendorderforazorpay', { orderId: orderId,customerid: customerid, amount: amount }).pipe(
      
    );

  }

   completeorderforrazorpay(obj: any, order_id: any,customerid:any,amount:any ) {
    return this.http.post<any>(this.baseUrl + '/order/completeorderforrazorpay', { customerid: customerid,  order_id, amount,transaction_details:obj }).pipe(
      
    );
  }
  deleteCustomerAddress(data: any) {

    return this.http.post(
      `${this.baseUrl}/customer/deleteCustomerAddress`,
      data
    );

  }
  getStoresDetails(storeid: any) {
    return this.http.get(this.uri + "api/store/detail/" + storeid)
  }
  aferselectareagetcategoriesandstores(areaId: string): Observable<any> {
    return this.http.post(this.baseUrl + '/customer/getcategoryandstoreandadminid', { areaId });
  }
  getcategoryyselectedara(areaId: string): Observable<any> {
    return this.http.post(this.baseUrl + '/customer/getcategoryyselectedara', { areaId });
  }
  selectareasubmit(areaId: string): Observable<any> {
    return this.http.post(this.baseUrl + '/customer/selectareasubmit', { areaId });
  }
  loadCategories(adminId: any) {
    return this.http.get(this.baseUrl + '/category/listapp/' + adminId);
  }
  getWishlistItems(data: any) {
    return this.http.post(this.baseUrl + '/customer/getWishlistItems', data);
  }
  searchItems(data: any) {
    return this.http.post(this.baseUrl + '/customer/searchItems', data);
  }
  getSearchSuggestions(data: any) {
    return this.http.post(this.baseUrl + '/customer/getSearchSuggestions', data);
  }
  getLevel2CategoryProducts(data: any) {
    return this.http.post(this.baseUrl + "/customer/getLevel2CategoryProducts", data)
  }
  getLevel3Categories(
    data: any
  ) {
    return this.http.post(this.baseUrl + "/customer/getLevel3Categories", data)

  }
getListbanner(data:any){
 return this.http.post(this.uri + "api/banner/getListbanner", data);
  }
  getLevel2CategoriesOnly(
    data: any
  ) {

    return this.http.post(

      this.baseUrl +
      '/customer/getLevel2CategoriesOnly',

      data

    );

  }
  addCustomerAddress(data: any) {

    return this.http.post(this.baseUrl + '/customer/addAddress', data);

  }

  getLevel3CategoryItems(
    data: any
  ) {

    return this.http.post(

      this.baseUrl +
      '/customer/getLevel3CategoryItems',

      data

    );

  }
  getLevel2ByLevel1(
    data: any
  ) {

    return this.http.post(

      this.baseUrl +
      '/customer/getLevel2ByLevel1',

      data

    );

  }
  getLevel1Categories(
    data: any
  ) {

    return this.http.post(

      this.baseUrl +
      '/customer/getLevel1Categories',

      data

    );
  }

  getHomeCategories(data: any) {

    return this.http.post(

      this.baseUrl + '/home/categories',

      data

    );

  }

  getHomeStores(data: any) {

    return this.http.post(

      this.baseUrl + '/home/stores',

      data

    );

  }

  getLevel1Items(data: any) {

    return this.http.post(

      this.baseUrl + '/home/level1-items',

      data

    );

  }

  getadmindetails(adminid: any) {
    return this.http.get(this.baseUrl + '/auth/details/' + adminid);
  }

  getorderbyid(data: any) {
    console.log(data);
    return this.http.get(this.baseUrl + '/order/order-details/' + data.orderid + '/' + data.ordertype);
  }
  getboyDetails(id:any){
        return this.http.get(this.baseUrl + '/deliveryboy/detail/' + id  );

  }
  cancelSubOrder(data: any) {

    return this.http.post(this.baseUrl + '/order/cancel-suborder', data);
  }
}