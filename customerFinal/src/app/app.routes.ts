// app.routes.ts
import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { Signup } from './pages/signup/signup';
import { Selectarea } from './selectarea/selectarea';
import { Home } from './home/home';
import { Storelist } from './storelist/storelist';
import { Storedetail } from './storedetail/storedetail';
import { Categories } from './categories/categories';
import { Productsoflvel2category } from './productsoflvel2category/productsoflvel2category';
import { ItemDetails } from './itemdetails/itemdetails';
 
import { Searchitem } from './searchitem/searchitem';
import { Cartpage } from './cartpage/cartpage';
import { Address } from './address/address';
import { Accounts } from './accounts/accounts';
import { Whishitems } from './whishitems/whishitems';
import { Support } from './support/support';
import { Orderlist } from './orderlist/orderlist';
import { Ordersuccessonline } from './ordersuccessonline/ordersuccessonline';
import { Ordersuccess } from './ordersuccess/ordersuccess';

import { Orderdetails } from './orderdetails/orderdetails';
import { Profile } from './profile/profile';
import { Onlinepayment } from './onlinepayment/onlinepayment';
import { Deliveryboytrack } from './deliveryboytrack/deliveryboytrack';
import { CustomOrderComponent } from './custom-order/custom-order';
import { CustomOrderList } from './custom-order-list/custom-order-list';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: Signup },
  { path: 'select-area/:comingfrom', component: Selectarea },
  { path: 'home', component: Home },
  { path: 'storelist', component: Storelist },
  { path: 'storedetails/:id', component: Storedetail },
  { path: 'categories', component: Categories },
  { path: 'productsoflvel2category/:id', component: Productsoflvel2category },
  { path: 'itemdetails/:id', component: ItemDetails },
  
  { path: 'searchitem/:searchfromUrl', component: Searchitem },
  { path: 'cart/:idnothingtouse', component: Cartpage },
  { path: 'addressaddselect/:idnothingtouse', component: Address },
  { path: 'accounts', component: Accounts },
  { path: 'wishlist', component: Whishitems },
  { path: 'orderlist/:id', component: Orderlist },
  { path: 'ordersuccess/:id/:ordertype', component: Ordersuccess },
  { path: 'order-details/:id/:ordertype/:storeId/:userType', component: Orderdetails },
 { path: 'deliveryboytrack/:id/:userType', component: Deliveryboytrack },
  { path: 'customorder/:id', component: CustomOrderComponent },
    { path: 'customorderlist/:id', component: CustomOrderList },





  { path: 'edit-profile', component: Profile },
  { path: 'support/:id', component: Support },

  { path: 'onlinepayment/:id/:ordertype/:name/:mobile', component: Onlinepayment },
  { path: 'ordersuccessonline/:id/:ordertype', component: Ordersuccessonline },

  { path: '**', redirectTo: 'login' },

];