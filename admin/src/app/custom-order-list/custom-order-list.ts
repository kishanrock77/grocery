import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api';
import { AuthService } from '../services/auth';
import { Common } from '../services/common';

@Component({
  selector: 'app-custom-order-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
  ],
  templateUrl: './custom-order-list.html',
  styleUrl: './custom-order-list.css',
})
export class CustomOrderList {

  storeList: any[] = [];


  constructor(private auth: AuthService,
    public common: Common,

    private route: ActivatedRoute,
    private api: ApiService,
    private router: Router
  ) {
    this.adminId =
      localStorage.getItem('adminId') || '';
    this.loadStores();
    this.loadCategories();

    this.getcustomorderlist();

  }
  submitted = false;

  loadStores() {
    this.loader = true;
    this.api.getStores(this.adminId).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.storeList = res.data;
          this.loader = false;
        }
      }
    });
  }
  action = '';
  workingobj: any = {};
  actionbyadmin(order: any, action: any) {

    this.action = action;

    this.workingobj = order;


    this.selectedCategories = [];


    this.approveData = {

      storeId: '',
      estimateAmount: '',
      estimateAmount_store: '',
      estimatemessage: ''

    };


    this.rejectReason = '';


    this.openpopup();


  }
  approveData: any = {

    storeId: '',
    estimateAmount: '',    estimateAmount_store: '',
    estimatemessage: ''

  };


  rejectReason = '';
  showpopup = false;
  openpopup() {
    this.showpopup = true;
  }
  closepopup() {
    this.showpopup = false;
    this.action = '';
    this.workingobj = {};

  }
  saveAdminreplyforcustomorder() {


    if (this.action == "Approve") {


      if (!this.approveData.storeId) {

        this.common.alertmessage(
          'Select Store',
          'Validation',
          'warning'
        );

        return;

      }



      if (this.selectedCategories.length == 0) {

        this.common.alertmessage(
          'Select Category',
          'Validation',
          'warning'
        );

        return;

      }

 if (!this.approveData.estimateAmount) {

        this.common.alertmessage(
          'Enter Estimate Amount for App',
          'Validation',
          'warning'
        );

        return;

      }

      if (!this.approveData.estimateAmount_store) {

        this.common.alertmessage(
          'Enter Estimate Amount forstore',
          'Validation',
          'warning'
        );

        return;

      }

     

    }



    else {


      if (!this.rejectReason) {

        this.common.alertmessage(
          'Enter Cancel Reason',
          'Validation',
          'warning'
        );

        return;

      }


    }



    let payload = {

 customerId: this.workingobj.customerId,

      orderId: this.workingobj._id,


      action: this.action,


      storeId: this.approveData.storeId,


      categories: this.selectedCategories,


      estimateAmount: this.approveData.estimateAmount,

estimateAmount_store: this.approveData.estimateAmount_store,
      estimatemessage: this.approveData.estimatemessage,


      cancelReason: this.rejectReason



    };



    this.loader = true;


    this.api.saveAdminreplyforcustomorder(payload)
      .subscribe((res: any) => {


        this.loader = false;


        if (res.success) {


          this.common.alertmessage(
            'Updated',
            'Success',
            'success'
          );


          this.closepopup();

          this.getcustomorderlist();


        }



      });



  }
  categories: any[] = [];
  level1List: any[] = [];
  level2List: any[] = [];
  level3List: any[] = [];
  level2ListToShow: any[] = [];
  level3ListToShow: any[] = [];

  selectedCategory: any = {};
  selectedCategories: any[] = [];



  loader = false;

  list: any = [];
  filterType = 'all';

  toggleMedical(order: any) {
    order.showMedical = !order.showMedical;
  }
  formatDate(date: any) {

    if (!date) {

      return '';

    }

    return new Date(date)

      .toLocaleString(

        'en-GB',

        {

          day: '2-digit',

          month: 'short',

          year: 'numeric',

          hour: '2-digit',

          minute: '2-digit',

          hour12: true

        }

      )

      .replace(',', '');

  }
  get filteredList() {

    if (this.filterType === 'admin') {
      return this.list.filter(
        (x: any) => x.statusByAdmin === 'pending'
      );
    }

    if (this.filterType === 'customer') {
      return this.list.filter(
        (x: any) =>
          x.statusByAdmin !== 'pending' &&  x.statusByAdmin !== 'rejected' &&
          x.statusByCustomer === 'pending'
      );
    }

    return this.list;
  }
  openImage(url: string) {

    window.open(
      url,
      '_blank'
    );

  }
  adminId: any;

  getcustomorderlist() {
    this.loader = true;


    this.api.customorderlist(this.adminId, "-1", 'admin').subscribe((res: any) => {
      this.loader = false;
      if (res.success) {

        this.list = res.data;
        this.filteredList();
      } else {
        this.common.alertmessage(



          'Something went wrong',

          'error',

          'error'

        );
      }


    }, (err: any) => {
      this.loader = false;
      this.common.alertmessage(



        'Something went wrong',

        'error',

        'error'

      );
    })
  }
  loadCategories() {
    const adminId = this.auth.getAdminId();
    this.api.loadCategories(adminId).subscribe({
      next: (res: any) => {
        this.categories = res;
        this.level1List = res.filter((x: any) => x.level_no == 1);
        this.level2List = res.filter((x: any) => x.level_no == 2);
        this.level3List = res.filter((x: any) => x.level_no == 3);
      },
      error: () => {
        this.common.alertmessage('Failed to load categories', 'Error', 'error');
      }
    });
  }

  onLevel1Change() {
    this.selectedCategory.parent_id = '';
    this.selectedCategory.level3_id = '';
    this.level2ListToShow = this.level2List.filter(
      x => x.grandparent_id === this.selectedCategory.level1_id
    );
  }

  onLevel2Change() {
    this.selectedCategory.level3_id = '';
    this.level3ListToShow = this.level3List.filter(
      x => x.parent_id === this.selectedCategory.parent_id
    );
  }

  onLevel3Change() {
    // const cat = this.level3List.find(
    //   x => x._id === this.selectedCategory.level3_id
    // );

    // if (cat) {
    //   cat.filtersforlevel3category.forEach((key: string) => {
    //     if (!this.filterKeys.some(k => k.key === key)) {
    //       this.filterKeys.push({ key, value: '' });
    //     }
    //   });
    // }
  }

  addCategory() {
    const level1 = this.selectedCategory.level1_id;
    const level2 = this.selectedCategory.parent_id;
    const level3 = this.selectedCategory.level3_id;

    if (!level1 || !level2 || !level3) {
      this.common.alertmessage(
        'Please select all category levels.',
        'Validation',
        'warning'
      );
      return;
    }

    // Duplicate category रोकें
    const exists = this.selectedCategories.some(
      (cat: any) => cat.level3 === level3
    );
    if (exists) {
      this.common.alertmessage(
        'Category already added.',
        'Warning',
        'warning'
      );
      return;
    }

    // Category Add करें
    this.selectedCategories.push({
      level1,
      level2,
      level3
    });

    // Level 3 Category खोजें
    const selectedCat = this.level3List.find(
      (c: any) => c._id === level3
    );



    // Reset dropdowns
    this.selectedCategory = {};
    this.level2ListToShow = [];
    this.level3ListToShow = [];


  }
  getCategoryName(id: string): string {
    const cat = this.level3List.find((c: any) => c._id === id);
    return cat ? cat.categoryName : '';
  }
  removeCategory(index: number) {
    const removedCategory = this.selectedCategories[index];
    const level3Id = removedCategory.level3;

    // Category हटाएँ
    this.selectedCategories.splice(index, 1);

  }
}
