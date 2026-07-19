// app.routes.ts
import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Signup } from './pages/signup/signup';
import { AdminDashboard } from './pages/admin-dashoard/admin-dashoard';
import { DeliveryboyDashboard } from './pages/deliveryboy-dashoard/deliveryboy-dashoard';
import { Orderlist } from './orderlist/orderlist';
import { AddStoreComponent } from './addstores/addstores';
import { Storelist } from './storelist/storelist';
import { Adddeliveryboy } from './adddeliveryboy/adddeliveryboy';
import { Deliveryboylist } from './deliveryboylist/deliveryboylist';
import { StoreOwnerComponent } from './storeowner/storeowner';
import { Itemcategory } from './itemcategory/itemcategory';
import { Itemlist } from './itemlist/itemlist';
import { AddItemComponent } from './additem/additem';
import { Itemassign } from './itemassign/itemassign';
import { StoreDashboard } from './pages/store-dashboard/store-dashboard';
import { SelectStore } from './select-store/select-store';
import { Area } from './area/area';
import { AdminComponent } from './admin/admin.component';
import { Cancelledorders } from './cancelledorders/cancelledorders';
import { Deliveredorders } from './deliveredorders/deliveredorders';
import { Customerlist } from './customerlist/customerlist';
import { Customerorder } from './customerorder/customerorder';
import { CustomOrderList } from './custom-order-list/custom-order-list';
import { Banner } from './banner/banner';


export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'signup', component: Signup },
  { path: 'admin-dashboard', component: AdminDashboard },
  { path: 'deliveryboy-dashboard', component: DeliveryboyDashboard },
  { path: 'orders', component: Orderlist },
  { path: 'addstore', component: AddStoreComponent },
  { path: 'addstore/:id', component: AddStoreComponent },
  { path: 'storelist', component: Storelist },
  { path: 'adddeliveryboy', component: Adddeliveryboy },
  { path: 'adddeliveryboy/:id', component: Adddeliveryboy },
  { path: 'deliveryboylist', component: Deliveryboylist },
  { path: 'storeowner', component: StoreOwnerComponent },
  { path: 'itemcategory', component: Itemcategory },
  { path: 'items', component: Itemlist },
  { path: 'additem/:id', component: AddItemComponent },
  { path: 'additem', component: AddItemComponent },
  { path: 'itemassign', component: Itemassign },
  { path: 'store-dashboard', component: StoreDashboard },
  { path: 'select-store', component: SelectStore },
  { path: 'deliveryarealist', component: Area },
  { path: 'admin', component: AdminComponent },
  { path: 'cancelledorders', component: Cancelledorders },
 { path: 'deliveredorders', component:  Deliveredorders },
 { path: 'customers', component:  Customerlist },
 { path: 'customerorder/:id', component:  Customerorder },
  { path: 'custom-order', component:  CustomOrderList },
  { path: 'banner', component:  Banner },

  { path: '**', redirectTo: 'login' }
];