// ========================================
// searchitem.ts
// COMPLETE UPDATED TS
// ========================================

import {
  Component,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
  ElementRef
} from '@angular/core';

import {
  ActivatedRoute,
  Router,
  RouterModule
} from '@angular/router';

import {
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';

import {
  CommonModule
} from '@angular/common';

import {
  debounceTime,
  distinctUntilChanged,
  Subject,
  Subscription
} from 'rxjs';

import { AuthService } from '../services/auth';
import { Common } from '../services/common';
import { ApiService } from '../services/api';

import { Footer } from '../footer/footer';
import { Subheader } from '../subheader/subheader';
import { ItemCard } from '../item-card/item-card';

import { PopupService } from '../services/popup';

import { Time12Pipe } from '../directive/time12Pipe.directive';
import { Addressreminder } from '../addressreminder/addressreminder';

@Component({
  selector: 'app-searchitem',

  templateUrl: './searchitem.html',

  styleUrl: './searchitem.css',

  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    Subheader,
    Footer,
    Addressreminder,
    ItemCard
  ],

})

export class Searchitem implements OnInit, OnDestroy {

  @Input() searchfromUrl: string = '';

  @ViewChild('searchInput')
  searchInput!: ElementRef;
  placeholder = "Search for atta, milk, food etc...."
  // ========================================
  // CATEGORY
  // ========================================

  categoryId: string = '';

  categoryLevel: string = '';

  // ========================================
  // SEARCH
  // ========================================

  searchText: string = '';

  searchFocused: boolean = false;

  searchPerformed: boolean = false;

  showSuggestions: boolean = false;

  loadingSearch: boolean = false;

  // ========================================
  // FILTER
  // ========================================

  sortType: string = '';

  // ========================================
  // ARRAYS
  // ========================================

  suggestionItems: any[] = [];

  globalSearchItems: any[] = [];

  categorySearchItems: any[] = [];

  wishlistItems: any[] = [];

  categories: any[] = [];

  oldSearches: string[] = [];

  // ========================================
  // RXJS
  // ========================================

  private searchSubject =
    new Subject<string>();

  routeParamsSubscription?: Subscription;
  searchSubjectSubscription?: Subscription;
  searchSuggestionsSubscription?: Subscription;
  searchItemsSubscription?: Subscription;
  browsedItemsSubscription?: Subscription;
  wishlistItemsSubscription?: Subscription;
  categoriesSubscription?: Subscription;

  private voiceEventHandler?: (event: Event) => void;
  focusTimeout?: ReturnType<typeof setTimeout>;
  logoutTimeout?: ReturnType<typeof setTimeout>;

  // ========================================
  // VOICE SEARCH
  // ========================================

  recognition: any;
  ngAfterViewInit() {

    this.focusTimeout && clearTimeout(this.focusTimeout);
    this.focusTimeout = setTimeout(() => {
      this.focusTimeout = undefined;
      this.searchInput
        ?.nativeElement
        ?.focus();
    }, 200);

  }
  constructor(

    private auth: AuthService,

    public api: ApiService,

    private common: Common,

    private router: Router,

    private route: ActivatedRoute,

    private popup: PopupService

  ) {

    // scroll top

    window.scrollTo({

      top: 0,

      behavior: 'smooth'

    });

  }
  // =====================================
  // FILTERS
  // =====================================

  priceSort: string = '';

  nameSort: string = '';


  // =====================================
  // PRICE SORT TOGGLE
  // =====================================

  togglePriceSort() {

    // reset name sort

    this.nameSort = '';

    // cycle:
    // '' -> asc -> desc -> ''

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

    this.applyFilters();

  }


  // =====================================
  // NAME SORT TOGGLE
  // =====================================

  toggleNameSort() {

    // reset price sort

    this.priceSort = '';

    // cycle:
    // '' -> asc -> desc -> ''

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

    this.applyFilters();

  }


  // =====================================
  // APPLY FILTERS
  // =====================================

  applyFilters() {

    // =========================
    // CATEGORY ITEMS
    // =========================

    this.sortItems(
      this.categorySearchItems
    );

    // =========================
    // GLOBAL ITEMS
    // =========================

    this.sortItems(
      this.globalSearchItems
    );

  }


  // =====================================
  // SORT FUNCTION
  // =====================================

  sortItems(items: any[]) {

    // =========================
    // PRICE ASC
    // =========================

    if (
      this.priceSort == 'asc'
    ) {

      items.sort((a, b) => {

        const aPrice =
          a?.minPrice || 0;

        const bPrice =
          b?.minPrice || 0;

        return aPrice - bPrice;

      });

    }

    // =========================
    // PRICE DESC
    // =========================

    else if (
      this.priceSort == 'desc'
    ) {

      items.sort((a, b) => {

        const aPrice =
          a?.minPrice || 0;

        const bPrice =
          b?.minPrice || 0;

        return bPrice - aPrice;

      });

    }

    // =========================
    // NAME ASC
    // =========================

    else if (
      this.nameSort == 'asc'
    ) {

      items.sort((a, b) => {

        const aName =
          (a?.itemName || '')
            .toLowerCase();

        const bName =
          (b?.itemName || '')
            .toLowerCase();

        return aName
          .localeCompare(bName);

      });

    }

    // =========================
    // NAME DESC
    // =========================

    else if (
      this.nameSort == 'desc'
    ) {

      items.sort((a, b) => {

        const aName =
          (a?.itemName || '')
            .toLowerCase();

        const bName =
          (b?.itemName || '')
            .toLowerCase();

        return bName
          .localeCompare(aName);

      });

    }

  }
  // ========================================
  // INIT
  // ========================================
  categoryname = '';
  ngOnInit() {
    this.voiceEventHandler = (event: Event) => {
      const customEvent = event as CustomEvent;

      this.focusTimeout && clearTimeout(this.focusTimeout);
      this.focusTimeout = setTimeout(() => {
        this.focusTimeout = undefined;
        this.searchText = customEvent.detail;
      //  this.common.alertmessage('VOICE RESULT 1:' + this.searchText, 'info', 'info');
      }, 0);

     // this.common.alertmessage('VOICE RESULT:' + this.searchText, 'info', 'info');

      // optional auto search
      this.onSearchInput();
    };

   window.addEventListener(
  'message',
  (event:any)=>{


    if(event.data?.type === 'VOICE_TEXT'){


      this.searchText =
        event.data.text;


      // this.common.alertmessage(
      //   'VOICE RESULT: '+this.searchText,
      //   'info',
      //   'info'
      // );


      this.onSearchInput();

    }

  }
);
    const adminId =
      this.auth.getAdminId();

    if (!adminId) {

      this.logout();

      return;

    }

    // ========================================
    // URL PARAMS
    // ========================================

    this.routeParamsSubscription?.unsubscribe();
    this.routeParamsSubscription = this.route.params.subscribe(p => {

      if (p['searchfromUrl']) {

        this.searchfromUrl =
          p['searchfromUrl'];

      }

      // ========================================
      // CATEGORY URL
      // l1_123
      // l2_123
      // ========================================

      if (
        this.searchfromUrl !== 'global'
      ) {

        const parts =
          this.searchfromUrl
            .split('_');

        if (parts.length === 3) {

          this.categoryLevel =
            parts[0];

          this.categoryId =
            parts[1];
          this.categoryname =
            parts[2];

          this.placeholder = `Search in ${this.categoryname}...`;
        }

      }

      // ========================================
      // DEFAULT SCREEN DATA
      // ========================================

      this.loadOldSearches();

      this.getWishlistItems();

      this.getCategories();

    });

    // ========================================
    // SEARCH DEBOUNCE
    // ========================================

    this.searchSubjectSubscription?.unsubscribe();
    this.searchSubjectSubscription = this.searchSubject.pipe(

      debounceTime(500),

      distinctUntilChanged()

    ).subscribe((value: string) => {

      if (value?.trim()) {

        this.getSearchSuggestions(
          value
        );

      }

      else {

        this.showSuggestions =
          false;

        this.suggestionItems = [];

      }

    });

  }

  // ========================================
  // SEARCH INPUT
  // ========================================

  onSearchInput() {

    this.searchSubject.next(
      this.searchText
    );

  }

  // ========================================
  // SEARCH SUGGESTIONS API
  // ========================================

  getSearchSuggestions(
    keyword: string
  ) {

    const body: any = {

      keyword,

      adminId:
        this.auth.getAdminId(),

      categoryId:
        this.categoryId,

      categoryLevel:
        this.categoryLevel,

      searchfromUrl:
        this.searchfromUrl

    };

    this.searchSuggestionsSubscription?.unsubscribe();

    this.searchSuggestionsSubscription = this.api.getSearchSuggestions(


      body

    ).subscribe({

      next: (res: any) => {

        this.suggestionItems =
          res?.items || [];

        // max 10

        this.suggestionItems =
          this.suggestionItems
            .slice(0, 10);

        this.showSuggestions =
          true;

      },

      error: () => {

        this.showSuggestions =
          false;

      }

    });

  }

  // ========================================
  // CLICK SUGGESTION
  // ========================================

  selectSuggestion(item: any) {

    this.searchText =
      item?.itemName || '';

    this.showSuggestions =
      false;

    this.submitSearch();

  }

  // ========================================
  // FINAL SEARCH API
  // ========================================

  submitSearch() {

    if (
      !this.searchText?.trim()
    ) {
      return;
    }

    this.loadingSearch = true;

    this.saveSearchTerm(
      this.searchText
    );

    this.searchPerformed = true;

    this.showSuggestions = false;

    const body: any = {

      keyword: this.searchText,

      adminId:
        this.auth.getAdminId(),

      categoryId:
        this.categoryId,

      categoryLevel:
        this.categoryLevel,

      searchfromUrl:
        this.searchfromUrl

    };

    this.searchItemsSubscription?.unsubscribe();

    this.searchItemsSubscription = this.api.searchItems(

      body

    ).subscribe({

      next: (res: any) => {

        this.loadingSearch = false;

        // ========================================
        // GLOBAL ITEMS
        // ========================================

        this.globalSearchItems =
          res?.globalItems || [];

        // ========================================
        // CATEGORY ITEMS
        // ========================================

        this.categorySearchItems =
          res?.categoryItems || [];

        this.applySorting();

      },

      error: () => {

        this.loadingSearch = false;

        this.globalSearchItems = [];

        this.categorySearchItems = [];

      }

    });

  }

  // ========================================
  // SORTING
  // ========================================

  applySorting() {

    const sortArray =
      (arr: any[]) => {

        // ====================
        // NAME ASC
        // ====================

        if (
          this.sortType ===
          'nameAsc'
        ) {

          arr.sort((a, b) =>

            (a?.itemName || '')
              .localeCompare(
                b?.itemName || ''
              )

          );

        }

        // ====================
        // NAME DESC
        // ====================

        if (
          this.sortType ===
          'nameDesc'
        ) {

          arr.sort((a, b) =>

            (b?.itemName || '')
              .localeCompare(
                a?.itemName || ''
              )

          );

        }

        // ====================
        // PRICE LOW
        // ====================

        if (
          this.sortType ===
          'priceLow'
        ) {

          arr.sort((a, b) =>

            (a?.price || 0) -
            (b?.price || 0)

          );

        }

        // ====================
        // PRICE HIGH
        // ====================

        if (
          this.sortType ===
          'priceHigh'
        ) {

          arr.sort((a, b) =>

            (b?.price || 0) -
            (a?.price || 0)

          );

        }

      };

    sortArray(
      this.globalSearchItems
    );

    sortArray(
      this.categorySearchItems
    );

  }

  // ========================================
  // OLD SEARCHES
  // ========================================

  loadOldSearches() {

    this.oldSearches =
      JSON.parse(

        localStorage.getItem(
          'oldSearches'
        ) || '[]'

      );

  }

  saveSearchTerm(term: string) {

    let arr: string[] =
      JSON.parse(

        localStorage.getItem(
          'oldSearches'
        ) || '[]'

      );

    // remove duplicate

    arr = arr.filter(x =>
      x !== term
    );

    // latest top

    arr.unshift(term);

    // limit

    arr = arr.slice(0, 15);

    localStorage.setItem(

      'oldSearches',

      JSON.stringify(arr)

    );

    this.oldSearches = arr;

  }

  deleteSearchTerm(term: string) {

    this.oldSearches =
      this.oldSearches.filter(
        x => x !== term
      );

    localStorage.setItem(

      'oldSearches',

      JSON.stringify(
        this.oldSearches
      )

    );

  }

  clearAllSearches() {

    this.oldSearches = [];

    localStorage.removeItem(
      'oldSearches'
    );

  }

  searchFromHistory(term: string) {

    this.searchText = term;

    this.submitSearch();

  }

  // ========================================
  // WISHLIST ITEMS API
  // ========================================

  borwseditemArrItems: any = [];
  geborwseditemItems() {

    const borwseditemArr =
      JSON.parse(

        localStorage.getItem(
          'bowseditemarr'
        ) || '[]'

      );

    if (!borwseditemArr?.length) {

      this.borwseditemArrItems = [];

      return;

    }

    // ========================================
    // API CALL
    // ========================================

    this.browsedItemsSubscription?.unsubscribe();

    this.browsedItemsSubscription = this.api.getWishlistItems(

      {

        itemIds: borwseditemArr,

        adminId:
          this.auth.getAdminId()

      }

    ).subscribe({

      next: (res: any) => {

        this.borwseditemArrItems =
          res?.items || [];

      },

      error: () => {

        this.borwseditemArrItems = [];

      }

    });

  }
  getWishlistItems() {

    const wishlistIds =
      JSON.parse(

        localStorage.getItem(
          'wishlist'
        ) || '[]'

      );

    if (!wishlistIds?.length) {

      this.wishlistItems = [];

      return;

    }

    const borwseditemArr =
      JSON.parse(

        localStorage.getItem(
          'bowseditemarr'
        ) || '[]'

      );

    if (borwseditemArr?.length && this.wishlistItems?.length) {
      // remove duplicate from browseditemArr based on wishlistItems

      const wishlistItemIds =
        new Set(
          this.wishlistItems.map(
            (x: any) => x._id
          )
        );

      const filteredBrowseditemArr = borwseditemArr.filter(
        (id: any) => !wishlistItemIds.has(id)
      );
      this.common.bowseditemarr = filteredBrowseditemArr;
      localStorage.setItem(
        'bowseditemarr',
        JSON.stringify(this.common.bowseditemarr)
      );
    }
    this.geborwseditemItems();
    // ========================================
    // API CALL
    // ========================================

    this.wishlistItemsSubscription?.unsubscribe();

    this.wishlistItemsSubscription = this.api.getWishlistItems(

      {

        itemIds: wishlistIds,

        adminId:
          this.auth.getAdminId()

      }

    ).subscribe({

      next: (res: any) => {

        this.wishlistItems =
          res?.items || [];

      },

      error: () => {

        this.wishlistItems = [];

      }

    });

  }

  // ========================================
  // CATEGORY API
  // ========================================
 opencustomorder() {
    this.popup.open('customorder', -1);
  }
  getCategories() {

    // ========================================
    // GLOBAL PAGE
    // show level1 categories
    // ========================================

    if (
      this.searchfromUrl ===
      'global'
    ) {

      this.categoriesSubscription?.unsubscribe();

      this.categoriesSubscription = this.api.getLevel1Categories(

        {

          adminId:
            this.auth.getAdminId()

        }

      ).subscribe({

        next: (res: any) => {

          this.categories =
            res?.categories || [];

        }

      });

      return;

    }

    // ========================================
    // L1 PAGE
    // show level2 categories
    // ========================================

    if (
      this.categoryLevel === 'l1'
    ) {

      this.categoriesSubscription?.unsubscribe();

      this.categoriesSubscription = this.api.getLevel2CategoriesOnly(

        {

          adminId:
            this.auth.getAdminId(),

          level1Id:
            this.categoryId

        }

      ).subscribe({

        next: (res: any) => {

          this.categories =
            res?.categories || [];

        }

      });

      return;

    }

    // ========================================
    // L2 PAGE
    // show level3 categories
    // ========================================

    if (
      this.categoryLevel === 'l2'
    ) {

      this.categoriesSubscription?.unsubscribe();

      this.categoriesSubscription = this.api.getLevel3Categories(

        {

          adminId:
            this.auth.getAdminId(),

          level2Id:
            this.categoryId

        }

      ).subscribe({

        next: (res: any) => {

          this.categories =
            res?.categories || [];

        }

      });

      return;

    }

  }

  // ========================================
  // CLEAR SEARCH
  // ========================================

  clearSearch() {

    this.searchText = '';

    this.searchPerformed = false;

    this.showSuggestions = false;

    this.globalSearchItems = [];

    this.categorySearchItems = [];

    this.suggestionItems = [];

  }

  // ========================================
  // VOICE SEARCH
  // ========================================
  gobacktocategory(cat: any) {
    this.popup.open(

      'productsoflvel2category',

      "l" + cat.level_no + "_" + cat._id + "_" + cat.categoryName

    );
  }
  async toggleVoiceSearchg() {

    const android = (window as any).AndroidVoice;

    if (!android || !android.startVoiceSearch) {

      this.common.alertmessage(
        'Voice not supported',
        'warning',
        'warning'
      );

      return;
    }

    try {
    //  this.common.alertmessage('Start speaking:', 'info', 'info');

      android.startVoiceSearch();
    } catch (e) {
      this.common.alertmessage('Error occurred while starting voice search:', 'error', 'error');
      console.log(e);
    }

  }

  isListening = false;
  // ========================================
  // BACK
  // ========================================

  goBack() {

    this.popup.close();

  }

  // ========================================
  // LOGOUT
  // ========================================

  logout() {

    this.popup.stack = [];

    this.logoutTimeout && clearTimeout(this.logoutTimeout);
    this.logoutTimeout = setTimeout(() => {
      this.logoutTimeout = undefined;
      this.auth.logoutredirect();
    }, 50);

  }

  ngOnDestroy(): void {
    this.routeParamsSubscription?.unsubscribe();
    this.searchSubjectSubscription?.unsubscribe();
    this.searchSuggestionsSubscription?.unsubscribe();
    this.searchItemsSubscription?.unsubscribe();
    this.browsedItemsSubscription?.unsubscribe();
    this.wishlistItemsSubscription?.unsubscribe();
    this.categoriesSubscription?.unsubscribe();

    if (this.voiceEventHandler) {
       window.addEventListener(
  'message',
  (event:any)=>{


    if(event.data?.type === 'VOICE_TEXT'){


      this.searchText =
        event.data.text;


      // this.common.alertmessage(
      //   'VOICE RESULT: '+this.searchText,
      //   'info',
      //   'info'
      // );


      this.onSearchInput();

    }

  }
);
      this.voiceEventHandler = undefined;
    }

    if (this.focusTimeout) {
      clearTimeout(this.focusTimeout);
      this.focusTimeout = undefined;
    }

    if (this.logoutTimeout) {
      clearTimeout(this.logoutTimeout);
      this.logoutTimeout = undefined;
    }
  }

}