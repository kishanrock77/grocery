

import { Component, OnInit, HostListener, OnDestroy } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

import { AuthService } from '../services/auth';
import { Common } from '../services/common';
import { ApiService } from '../services/api';
import { Footer } from '../footer/footer';
import { Subheader } from '../subheader/subheader';
import { PopupService } from '../services/popup';
import { Addressreminder } from '../addressreminder/addressreminder';

@Component({
  selector: 'app-all-categories',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    Subheader,Addressreminder,
    Footer
  ],
  templateUrl: './categories.html',
  styleUrl: './categories.css',
})
export class Categories implements OnInit, OnDestroy {

  constructor(
    private auth: AuthService,
    public api: ApiService,
    private common: Common,
    private router: Router, private popup: PopupService
  ) { }

  selectedArea: any = null;

  categories: any[] = [];

  level1: any[] = [];
  level2: any[] = [];
  level3: any[] = [];

  selectedLevel1: any = null;

  searchText = '';

  isLoading = false;

  stickySearch = false;
searchFocused: boolean = false;
  categoriesSubscription?: Subscription;

  ngOnInit(): void {
 window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
    if (!this.auth.isloggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    const session = this.auth.getSession();

    if (!session?.selectedArea) {
      this.router.navigate(['/select-area/categories']);
      return;
    }

    this.selectedArea = session.selectedArea;

    this.loadData();
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.stickySearch = window.scrollY > 70;
  }

  ngOnDestroy(): void {
    this.categoriesSubscription?.unsubscribe();
  }

  loadData(): void {

    if (this.common.categorylist?.length) {

      this.setData(this.common.categorylist);
      return;
    }

    this.isLoading = true;
    const adminId = this.auth.getAdminId();

    this.categoriesSubscription?.unsubscribe();

    this.categoriesSubscription = this.api.loadCategories(adminId)
      .subscribe({
        next: (res: any) => {

          this.isLoading = false;

          this.common.categorylist = res;

          this.setData(res || []);
        },

        error: () => {
          this.isLoading = false;
        }
      });
  }

  setData(categories: any[]) {

    this.categories = categories || [];

    this.level1 = this.categories.filter((x: any) => x.level_no === 1);

    this.level2 = this.categories.filter((x: any) => x.level_no === 2);

    this.level3 = this.categories.filter((x: any) => x.level_no === 3);
  }

  selectLevel1(cat: any) {
    this.selectedLevel1 = cat;

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  selectAll() {
    this.selectedLevel1 = null;

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  clearSearch() {
    this.searchText = '';
  }

  getLevel2(parentId: string) {

    return this.level2.filter(
      (x: any) => x.grandparent_id === parentId
    );
  }

  getLevel3(level2Id: string) {

    return this.level3.filter(
      (x: any) => x.grandparent_id === level2Id
    );
  }

  getFilteredLevel2() {

    if (!this.searchText.trim()) return [];

    const search = this.searchText.toLowerCase();

    return this.level2.filter((l2: any) => {

      // 🔥 level 2 match
      const level2Match =
        l2.categoryName
          ?.toLowerCase()
          .includes(search);

      // 🔥 parent level 1
      const parentLevel1 = this.level1.find(
        (l1: any) => l1._id === l2.grandparent_id
      );

      // 🔥 level 1 match
      const level1Match =
        parentLevel1?.categoryName
          ?.toLowerCase()
          .includes(search);

      return level2Match || level1Match;
    });
  }

  gotocategoryplusitemlist(cat: any) {
    this.popup.open('productsoflvel2category', "l2_" + cat._id);

  }

  trackById(index: number, item: any) {
    return item._id;
  }
}