import {
  Router,
  RouterModule,
  NavigationEnd
} from '@angular/router';
import { Subscription } from 'rxjs';

import {
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';

import {
  CommonModule
} from '@angular/common';

import {
  Component,
  Input,
  OnInit,
  AfterViewInit
} from '@angular/core';

import { filter } from 'rxjs/operators';

import { AuthService } from '../services/auth';
import { Common } from '../services/common';
import { ApiService } from '../services/api';

import { Viewcartbutton } from '../viewcartbutton/viewcartbutton';
import { PopupService } from '../services/popup';

@Component({

  selector: 'app-footer',

  standalone: true,

  imports: [

    CommonModule,

    FormsModule,

    ReactiveFormsModule,

    RouterModule,

    Viewcartbutton

  ],

  templateUrl: './footer.html',

  styleUrl: './footer.css',

})

export class Footer
  implements OnInit, AfterViewInit {

  // =====================================
  // INPUT
  // =====================================

  @Input()
  alwayshide: any = false;
  @Input()
  pagenow: any = '';



  // =====================================
  // NAV ITEMS
  // =====================================

  navItems = [

    {

      label: 'Home',

      path: '/home',

      icon: 'ri-home-5-line'

    },

    {

      label: 'Categories',

      path: '/categories',

      icon: 'ri-grid-line'

    },

    {

      label: 'Stores',

      path: '/storelist',

      icon: 'ri-store-2-fill'

    },

    {

      label: 'Account',

      path: '/accounts',

      icon: 'ri-user-3-line'

    },

    {

      label: 'Support',

      path: '/support/-1',

      icon: 'ri-headphone-line'

    }

  ];

  // =====================================
  // VARIABLES
  // =====================================

  activeIndex = -2;

  hideFooter = false;

  showScrollTop = false;

  lastScrollTop = 0;

  scrollContainer: any = null;

  // =====================================
  // CONSTRUCTOR
  // =====================================

  constructor(

    private auth: AuthService,

    private api: ApiService,

    private common: Common,
    public popupService: PopupService,
    private router: Router

  ) {

    // LOGIN CHECK
    this.auth.isloggedIn() ||
      this.router.navigate(['/login']);

    // AREA CHECK
    const session =
      this.auth.getSession();

    if (!session?.selectedArea) {

      this.router.navigate([
        '/select-area/footer'
      ]);

    }

    // ROUTE CHANGE
    this.router.events

      .pipe(

        filter(

          event =>
            event instanceof
            NavigationEnd

        )

      )

      .subscribe(() => {

        this.setActiveTab();

      });

  }
  itempopsubscription?: Subscription;

  // =====================================
  // INIT
  // =====================================
  showpopofitemconditionrightnowfooter = false;

  ngOnInit() {

    if (this.common.amionwhishlist) {
      this.itempopsubscription = this.common.popofitemcondition$.subscribe(async (res: any) => {
        console.log('POP OF ITEM CONDITION  footer=>', res);

        this.showpopofitemconditionrightnowfooter = res;


      });
    }

    this.setActiveTab();

  }
  ngOnDestroy(): void {



    this.itempopsubscription?.unsubscribe();

  }
  // =====================================
  // AFTER VIEW INIT
  // =====================================

  ngAfterViewInit() {

    setTimeout(() => {

      // =================================
      // CUSTOM SCROLL CONTAINER
      // =================================

      this.scrollContainer =

        document.querySelector(
          '.custom-scroll-container'
        );

      // =================================
      // CUSTOM SCROLL
      // =================================

      if (this.scrollContainer) {

        this.scrollContainer
          .addEventListener(

            'scroll',

            this.handleScroll
              .bind(this)

          );

      }

      // =================================
      // WINDOW SCROLL
      // =================================

      else {

        window.addEventListener(

          'scroll',

          this.handleScroll
            .bind(this)

        );

      }

    }, 300);

  }

  // =====================================
  // ACTIVE TAB
  // =====================================

  setActiveTab() {

    const current =
      this.router.url;

    const index =
      this.navItems.findIndex(

        i =>
          current.includes(
            i.path
          )

      );

    if (index !== -1) {

      this.activeIndex = index;

    }

  }

  // =====================================
  // NAVIGATE
  // =====================================

  navigate(
    path: string,
    index: number
  ) {
    this.popupService.stack = [];
    this.activeIndex = index;

    this.router.navigate([path]);

  }

  // =====================================
  // HANDLE SCROLL
  // =====================================

  handleScroll() {

    let scrollTop = 0;

    // =================================
    // CUSTOM SCROLL
    // =================================

    if (this.scrollContainer) {

      scrollTop =

        this.scrollContainer
          .scrollTop;

    }

    // =================================
    // WINDOW SCROLL
    // =================================

    else {

      scrollTop =

        window.pageYOffset ||

        document.documentElement
          .scrollTop;

    }

    // =================================
    // SHOW BUTTON
    // =================================

    this.showScrollTop =
      scrollTop > 200;

    // =================================
    // HIDE FOOTER
    // =================================

    if (
      scrollTop >
      this.lastScrollTop
    ) {

      this.hideFooter = true;

    }

    // =================================
    // SHOW FOOTER
    // =================================

    else {

      this.hideFooter = false;

    }

    this.lastScrollTop =

      scrollTop <= 0
        ? 0
        : scrollTop;

  }

  // =====================================
  // SCROLL TO TOP
  // =====================================

  scrollToTop() {

    // CUSTOM SCROLL
    if (this.scrollContainer) {

      this.scrollContainer
        .scrollTo({

          top: 0,

          behavior: 'smooth'

        });

    }

    // WINDOW SCROLL
    else {

      window.scrollTo({

        top: 0,

        behavior: 'smooth'

      });

    }

  }

  // =====================================
  // HOME
  // =====================================

  goHome() {

    this.router.navigate([
      '/home'
    ]);

  }

  // =====================================
  // CART
  // =====================================

  goCart() {

    this.router.navigate([
      '/cart'
    ]);

  }

}