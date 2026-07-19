import {
  Component,
  Input,
  OnDestroy,
  OnInit
} from '@angular/core';

import {
  ActivatedRoute,
  Router,
  RouterModule
} from '@angular/router';

import {
  CommonModule
} from '@angular/common';

import {
  FormsModule
} from '@angular/forms';

import { Subscription } from 'rxjs';

import { AuthService } from '../services/auth';
import { ApiService } from '../services/api';
import { Common } from '../services/common';
import { PopupService } from '../services/popup';

import { Footer } from '../footer/footer';
import { Subheader } from '../subheader/subheader';
import { ItemCard } from '../item-card/item-card';

@Component({

  standalone: true,

  selector: 'app-productsoflvel2category',

  templateUrl:
    './productsoflvel2category.html',

  styleUrl:
    './productsoflvel2category.css',

  imports: [

    CommonModule,

    FormsModule,

    RouterModule,

    Footer,

    Subheader,

    ItemCard

  ]

})

export class Productsoflvel2category
  implements OnInit, OnDestroy {

  // =========================================
  // INPUT
  // =========================================

  routeParamsSubscription?: Subscription;
  level2Subscription?: Subscription;
  categoriesSubscription?: Subscription;
  itemsSubscription?: Subscription;

  @Input()
  catidfromSelectero: any = '';
  queryParamsSubscription?: Subscription;
  // =========================================
  // CATEGORY TYPE
  // =========================================

  categoryType: any = '';

  mainCategoryId: any = '';

  selectedLevel2Id: any = '';

  // =========================================
  // LEVEL 2
  // =========================================

  level2List: any[] = [];

  level2Data: any = {};

  // =========================================
  // LEVEL 3
  // =========================================

  level3Categories: any[] = [];

  selectedLevel3Id: any = '';
  requestedL3Id: any = '';
  requestedL2Id: any = '';
  // =========================================
  // ITEMS CACHE
  // =========================================

  loadedCategoryItems: any = {};

  // =========================================
  // DISPLAY ITEMS
  // =========================================

  displayItems: any[] = [];

  // =========================================
  // LOADING
  // =========================================

  loading = false;

  itemLoading = false;

  // =========================================
  // SORT
  // =========================================

  priceSort: any = '';

  nameSort: any = '';

  // =========================================
  // CONSTRUCTOR
  // =========================================

  constructor(

    private auth: AuthService,

    public api: ApiService,

    private common: Common,

    private router: Router,

    private popup: PopupService,

    private route: ActivatedRoute

  ) { }

  // =========================================
  // INIT
  // =========================================

  ngOnInit(): void {

    const adminId =
      this.auth.getAdminId();

    // =====================================
    // LOGIN CHECK
    // =====================================

    if (!adminId) {

      this.auth.logoutredirect();

      return;

    }
    this.queryParamsSubscription?.unsubscribe();

    this.queryParamsSubscription =
      this.route.queryParams.subscribe(params => {

        if (params['l3id']) {

          this.requestedL3Id = params['l3id'];

        }
        if (params['l2id']) {

          this.requestedL2Id = params['l2id'];

        }

      });
    // =====================================
    // ROUTE PARAMS
    // =====================================

    this.routeParamsSubscription?.unsubscribe();
    this.routeParamsSubscription = this.route.params.subscribe(params => {

      // URL PARAM
      if (params['id']) {
        this.catidfromSelectero = params['id'];
        this.handleIncomingId(
          params['id']
        );

      }

      // INPUT PARAM
      else if (
        this.catidfromSelectero
      ) {

        this.handleIncomingId(
          this.catidfromSelectero
        );

      }

      // NO ID
      else {

        this.router.navigate([
          '/categories'
        ]);

      }

    });

  }

  ngOnDestroy(): void {

    this.routeParamsSubscription?.unsubscribe();

    this.queryParamsSubscription?.unsubscribe();

    this.level2Subscription?.unsubscribe();

    this.categoriesSubscription?.unsubscribe();

    this.itemsSubscription?.unsubscribe();

  }

  // =========================================
  // HANDLE ID
  // =========================================

  handleIncomingId(id: any) {

    // INVALID
    if (
      !id ||
      (
        !id.startsWith('l1_') &&
        !id.startsWith('l2_')
      )
    ) {

      this.router.navigate([
        '/categories'
      ]);

      return;

    }

    // =====================================
    // LEVEL 1
    // =====================================

    if (id.startsWith('l1_')) {

      this.categoryType = 'l1';

      let mainCategoryIdtmp =
        id.replace('l1_', '');
      this.mainCategoryId = mainCategoryIdtmp.split('_')[0];
      this.getLevel2FromLevel1();

    }

    // =====================================
    // LEVEL 2
    // =====================================

    else if (
      id.startsWith('l2_')
    ) {

      this.categoryType = 'l2';

      let selectedLevel2Idtmp =
        id.replace('l2_', '');
      this.selectedLevel2Id = selectedLevel2Idtmp.split('_')[0];
      this.getCategories();

    }

  }

  // =========================================
  // GET LEVEL2 FROM LEVEL1
  // =========================================

  getLevel2FromLevel1() {

    this.loading = true;

    this.level2Subscription?.unsubscribe();

    this.level2Subscription = this.api.getLevel2ByLevel1({

      level1Id:
        this.mainCategoryId,

      adminId:
        this.auth.getAdminId()

    }).subscribe({

      next: (res: any) => {

        this.loading = false;

        this.level2List =
          res.categories || [];

        // QUERY L2 SELECT
        if (
          this.requestedL2Id &&
          this.level2List.some(
            (x: any) => x._id == this.requestedL2Id
          )
        ) {

          this.selectLevel2(
            this.requestedL2Id
          );

        }

        // AUTO SELECT FIRST
        else if (
          this.level2List.length > 0
        ) {

          this.selectLevel2(
            this.level2List[0]._id
          );

        }


      },

      error: (err: any) => {

        this.loading = false;



      }

    });

  }

  // =========================================
  // SELECT LEVEL2
  // =========================================

  selectLevel2(_id: any, fromview = false) {




    if (fromview && this.common.browserorapp == 'browser') {

      this.popup.open(

        'productsoflvel2category',

        this.catidfromSelectero + "?l2id=" + _id

      );
      return;
    }


    this.selectedLevel2Id =
      _id;

    // RESET
    this.level3Categories = [];

    this.selectedLevel3Id = '';

    this.displayItems = [];

    this.getCategories();

  }

  // =========================================
  // GET LEVEL3 CATEGORIES
  // =========================================

  getCategories() {

    this.loading = true;

    this.categoriesSubscription?.unsubscribe();

    this.categoriesSubscription = this.api.getLevel3Categories({

      level2Id:
        this.selectedLevel2Id,

      adminId:
        this.auth.getAdminId()

    }).subscribe({

      next: (res: any) => {

        this.loading = false;

        this.level2Data =
          res.level2Category || {};

        // SINGLE LEVEL2 FLOW
        if (
          this.categoryType == 'l2'
        ) {

          this.level2List = [
            this.level2Data
          ];

        }

        this.level3Categories =
          res.categories || [];

        // QUERY L3 SELECT
        // QUERY L3 SELECT
        if (
          this.requestedL3Id &&
          this.level3Categories.some(
            (x: any) => x._id == this.requestedL3Id
          )
        ) {


          this.selectCategory(
            this.requestedL3Id, false
          );

        }



        // AUTO SELECT FIRST LEVEL3
        else if (
          this.level3Categories.length > 0
        ) {

          this.selectCategory(
            this.level3Categories[0]._id, false
          );

        }



        else {

          this.displayItems = [];

        }

      },

      error: (err: any) => {

        this.loading = false;



      }

    });

  }

  // =========================================
  // GET SELECTED CATEGORY NAME
  // =========================================

  getSelectedCategoryName() {

    const cat =
      this.level3Categories.find(

        (x: any) =>
          x._id == this.selectedLevel3Id

      );

    return cat?.categoryName || '';

  }

  // =========================================
  // SELECT LEVEL3 CATEGORY
  // =========================================

  selectCategory(selectedLevel3Id: any, fromview = false) {

    if (this.common.browserorapp == undefined) {
      this.common.browserorapp = localStorage.getItem('browserorapp');
    }

    if (fromview && this.common.browserorapp == 'browser') {

      this.popup.open(

        'productsoflvel2category',

        this.catidfromSelectero + "?l3id=" + selectedLevel3Id + "&l2id=" + this.selectedLevel2Id

      );
      return;
    }
    this.selectedLevel3Id = selectedLevel3Id;

    // =====================================
    // ALREADY LOADED
    // =====================================

    if (
      this.loadedCategoryItems[selectedLevel3Id]
    ) {

      this.applySorting();

      return;

    }

    this.itemLoading = true;

    this.itemsSubscription?.unsubscribe();

    this.itemsSubscription = this.api.getLevel3CategoryItems({

      level2Id:
        this.selectedLevel2Id,

      level3Id:
        selectedLevel3Id,

      adminId:
        this.auth.getAdminId()

    }).subscribe({

      next: (res: any) => {

        this.itemLoading = false;

        this.loadedCategoryItems[
          selectedLevel3Id
        ] = res.items || [];

        this.applySorting();

      },

      error: (err: any) => {

        this.itemLoading = false;

        console.log(err);

      }

    });

  }

  // =========================================
  // PRICE SORT TOGGLE
  // =========================================

  togglePriceSort() {

    // RESET NAME SORT
    this.nameSort = '';

    // TOGGLE PRICE
    if (this.priceSort == '') {

      this.priceSort = 'asc';

    }

    else if (
      this.priceSort == 'asc'
    ) {

      this.priceSort = 'desc';

    }

    else {

      this.priceSort = '';

    }

    this.applySorting();

  }

  // =========================================
  // NAME SORT TOGGLE
  // =========================================

  toggleNameSort() {

    // RESET PRICE SORT
    this.priceSort = '';

    // TOGGLE NAME
    if (this.nameSort == '') {

      this.nameSort = 'asc';

    }

    else if (
      this.nameSort == 'asc'
    ) {

      this.nameSort = 'desc';

    }

    else {

      this.nameSort = '';

    }

    this.applySorting();

  }

  // =========================================
  // APPLY SORTING
  // =========================================

  applySorting() {

    let items = [

      ...(this.loadedCategoryItems[
        this.selectedLevel3Id
      ] || [])

    ];

    // =====================================
    // PRICE SORT
    // =====================================

    if (this.priceSort == 'asc') {

      items.sort((a: any, b: any) => {

        return (
          this.getMinPrice(a)
          -
          this.getMinPrice(b)
        );

      });

    }

    else if (
      this.priceSort == 'desc'
    ) {

      items.sort((a: any, b: any) => {

        return (
          this.getMinPrice(b)
          -
          this.getMinPrice(a)
        );

      });

    }

    // =====================================
    // NAME SORT
    // =====================================

    if (this.nameSort == 'asc') {

      items.sort((a: any, b: any) => {

        return (
          a.itemName || ''
        ).localeCompare(

          b.itemName || ''

        );

      });

    }

    else if (
      this.nameSort == 'desc'
    ) {

      items.sort((a: any, b: any) => {

        return (
          b.itemName || ''
        ).localeCompare(

          a.itemName || ''

        );

      });

    }

    this.displayItems = items;

  }

  // =========================================
  // GET MIN PRICE
  // =========================================

  getMinPrice(item: any): number {

    // VARIANTS
    if (
      item.variants &&
      item.variants.length > 0
    ) {

      const prices =
        item.variants.map((v: any) => {

          return v.appPrice > 0
            ? v.appPrice
            : v.appPrice;

        });

      return Math.min(...prices);

    }

    // NORMAL ITEM
    return item.appPrice > 0
      ? item.appPrice
      : item.appPrice;

  }

  // =========================================
  // OPEN PAGE
  // =========================================

  goToSearch(data: any) {


    this.popup.open(
      'searchitem', this.catidfromSelectero

    );


  }
  opencustomorder() {
    this.popup.open('customorder', -1);
  }



}