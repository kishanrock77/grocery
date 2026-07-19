import {
  Component,
  Input,
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
  implements OnInit {

  // =========================================
  // INPUT
  // =========================================

  @Input()
  catidfromSelectero: any = '';

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

    // =====================================
    // ROUTE PARAMS
    // =====================================

    this.route.params.subscribe(params => {

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

    this.api.getLevel2ByLevel1({

      level1Id:
        this.mainCategoryId,

      adminId:
        this.auth.getAdminId()

    }).subscribe({

      next: (res: any) => {

        this.loading = false;

        this.level2List =
          res.categories || [];

        // AUTO SELECT FIRST
        if (
          this.level2List.length > 0
        ) {

          this.selectLevel2(
            this.level2List[0]
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

  selectLevel2(cat: any) {

    this.selectedLevel2Id =
      cat._id;

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

    this.api.getLevel3Categories({

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

        // AUTO SELECT FIRST LEVEL3
        if (
          this.level3Categories.length > 0
        ) {

          this.selectCategory(

            this.level3Categories[0]

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

  selectCategory(cat: any) {

    this.selectedLevel3Id = cat._id;

    // =====================================
    // ALREADY LOADED
    // =====================================

    if (
      this.loadedCategoryItems[cat._id]
    ) {

      this.applySorting();

      return;

    }

    this.itemLoading = true;

    this.api.getLevel3CategoryItems({

      level2Id:
        this.selectedLevel2Id,

      level3Id:
        cat._id,

      adminId:
        this.auth.getAdminId()

    }).subscribe({

      next: (res: any) => {

        this.itemLoading = false;

        this.loadedCategoryItems[
          cat._id
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