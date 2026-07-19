

import { Component, OnInit } from '@angular/core';

import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ApiService } from '../services/api';
import { AuthService } from '../services/auth';
import { Common } from '../services/common';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
@Component({
  selector: 'app-itemassign',
  imports: [CommonModule, ReactiveFormsModule, RouterModule, FormsModule],
  templateUrl: './itemassign.html',
  styleUrl: './itemassign.css',
})
export class Itemassign {
  selectedStore: any = ''; selectedCategory: any = '';;
  constructor(private service: ApiService, public common: Common,
    private auth: AuthService,
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.auth.isloggedIn() || this.router.navigate(['/login']);
    this.session = this.auth.getSession();
    this.session.userType === 'admin' || this.router.navigate(['/login']);


  }
  ngOnInit(): void {
    this.adminId = this.session.adminId;
    this.loadCategories();
    this.loadStores();


  }
  categoriesLevel1: any[] = [];

  loadCategories() {
    this.isLoading = true;
    const adminId = this.auth.getAdminId();
    this.service.loadCategories(adminId).subscribe({
      next: (res: any) => {

        this.categoriesLevel1 = res.filter((x: any) => x.level_no == 1);
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.common.alertmessage('Failed to load categories', 'Error', 'error');
      }
    });
  }
  session: any;
  selectedItems: Set<string> = new Set();
  generalItems: any[] = [];
  generalItemsBackup: any[] = [];
  storeItems: any[] = [];
  isLoading: boolean = false;
  storeList: any[] = [];

  adminId: any;
  loadStores() {
    this.isLoading = true;
    this.service.getStores(this.session.adminId).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.storeList = res.data;
          this.isLoading = false;
        }
      }
    });
  }
  loadGeneralItems() {


    this.service.getGeneralItems(this.selectedCategory, this.adminId!)
      .subscribe((res: any) => {
        this.generalItems = JSON.parse(JSON.stringify(res.data));
        this.generalItemsBackup = JSON.parse(JSON.stringify(res.data));
        this.isLoading = false;
        this.matchItems();
      }, err => {
        this.isLoading = false;
        this.common.alertmessage('Failed to load general items', 'Error', 'error');
      });
  }
  selectedStoreData: any;
  hidealldivtoshowmessage = false;
  updateOptionAppPrice(opt: any) {
    opt.appPrice = this.calculateAppPrice(Number(opt.storePrice));
  }
  loadStoreItems(fromsave = false) {

    if (!fromsave) {
      this.generalItems = JSON.parse(JSON.stringify(this.generalItemsBackup));
    }
    this.selectedItems.clear();

    if (!this.selectedStore) {
      this.storeItems = [];
      return;
    }

    this.storeList.forEach(store => {
      if (store._id === this.selectedStore) {
        this.selectedStoreData = store;
      }
    });
    if (!fromsave) {
      this.increasepricebyNew = this.selectedStoreData?.increasepriceby || 0;
    }

    this.isLoading = true;
    this.hidealldivtoshowmessage = false;
    this.service.getStoreItems(this.selectedStore)
      .subscribe((res: any) => {
        this.storeItems = res.data;

        //  find if in list if any item i thre which has been addedByString store
        this.hidealldivtoshowmessage = false;

        const storeAddedItems = this.storeItems.filter((item: any) => item.addedByString === 'store');
        if (storeAddedItems.length > 0) {
          this.hidealldivtoshowmessage = true;
        }
        this.isLoading = false;

        this.matchItems();
      }, err => {
        this.isLoading = false;
        this.common.alertmessage('Failed to load store items', 'Error', 'error');
      });
  }

  matchItems() {
    if (this.storeItems.length === 0 || this.generalItems.length === 0) {
      this.selectedItems.clear();
      return;
    }
    this.mergeStoreData();
  }
  updateApppriceforallselected() {
    this.generalItems.forEach((item: any) => {

      if (this.selectedItems.has(item._id)) {

        // ✅ SINGLE
        if (item.itemType === "single") {
          item.appPrice = this.calculateAppPrice(Number(item.storePrice));
        }

        // ✅ VARIANTS
        else if (item.itemType === "variant") {
          item.variantItems?.forEach((variant: any) => {
            variant.appPrice = this.calculateAppPrice(Number(variant.storePrice));

            // 🔥 variant custom questions
            variant.itemQuestions?.forEach((q: any) => {
              q.options?.forEach((opt: any) => {
                opt.appPrice = this.calculateAppPrice(Number(opt.storePrice));
              });
            });
          });
        }

        // ✅ ADDONS
        item.addons?.forEach((addon: any) => {
          addon.appPrice = this.calculateAppPrice(Number(addon.storePrice));
        });

        // 🔥 MAIN ITEM CUSTOM QUESTIONS
        item.itemQuestions?.forEach((q: any) => {
          q.options?.forEach((opt: any) => {
            opt.appPrice = this.calculateAppPrice(Number(opt.storePrice));
          });
        });

      }

    });
  }
  increasepricebyNew: number = 0;

  // Dynamic percentage (Admin/Config से बदला जा सकता है)
  mergeQuestions(generalQ: any[], storeQ: any[]) {
    if (!generalQ || !storeQ) return;

    generalQ.forEach((gq: any) => {
      const sq = storeQ.find(
        (s: any) => s.title === gq.title   // ⚠️ title se match kar rahe ho
      );

      if (sq) {
        gq.options?.forEach((gOpt: any) => {
          const sOpt = sq.options?.find(
            (o: any) => o.label === gOpt.label
          );

          if (sOpt) {
            gOpt.storePrice = sOpt.storePrice;
            gOpt.appPrice = sOpt.appPrice;
          }
        });
      }
    });
  }
  mergeStoreData() {
    this.selectedItems.clear();

    this.generalItems.forEach((generalItem: any) => {
      const storeItem = this.storeItems.find(
        (s: any) =>
          s.original_item_id?.toString() === generalItem._id?.toString()
      );

      if (storeItem) {
        this.selectedItems.add(generalItem._id);

        // ✅ Item Price
        generalItem.storePrice = storeItem.storePrice;
        generalItem.appPrice = storeItem.appPrice;
        generalItem.isFromStore = true;

        // =========================
        // ✅ ITEM QUESTIONS
        // =========================
        this.mergeQuestions(generalItem.itemQuestions, storeItem.itemQuestions);

        // =========================
        // ✅ VARIANTS
        // =========================
        if (generalItem.itemType === "variant") {
          generalItem.variantItems?.forEach((variant: any) => {

            const storeVariant = storeItem.variantItems?.find(
              (sv: any) =>
                sv.original_item_id?.toString() === variant._id?.toString()
            );

            if (storeVariant) {
              variant.storePrice = storeVariant.storePrice;
              variant.appPrice = storeVariant.appPrice;
              variant.isFromStore = true;

              // ✅ Variant Questions
              this.mergeQuestions(
                variant.itemQuestions,
                storeVariant.itemQuestions
              );

            } else {
              variant.isFromStore = false;
            }

          });
        }

        // =========================
        // ✅ ADDONS
        // =========================
        generalItem.addons?.forEach((addon: any) => {
          const storeAddon = storeItem.addons?.find(
            (sa: any) =>
              sa.original_item_id?.toString() === addon._id?.toString()
          );

          if (storeAddon) {
            addon.storePrice = storeAddon.storePrice;
            addon.appPrice = storeAddon.appPrice;
            addon.isFromStore = true;
          } else {
            addon.isFromStore = false;
          }
        });

      } else {
        // ❌ New Item
        generalItem.isFromStore = false;


        if (generalItem.itemType === "variant") {
          generalItem.variantItems?.forEach((variant: any) => {
            variant.isFromStore = false;


          });
        }

        generalItem.addons?.forEach((addon: any) => {
          addon.isFromStore = false;
        });
      }
    });
  }
  resetQuestions(questions: any[]) {
    questions?.forEach((q: any) => {
      q.options?.forEach((opt: any) => {
        opt.storePrice = 0;
        opt.appPrice = 0;
      });
    });
  }
  calculateAppPrice(storePrice: number): number {
    if (!storePrice || storePrice <= 0) return 0;

    const percentage = this.increasepricebyNew || 0;
    return Math.round(storePrice + (storePrice * percentage) / 100);
  }
  updateVariantAppPrice(variant: any) {
    variant.appPrice = this.calculateAppPrice(Number(variant.storePrice));
  }

  updateItemAppPrice(item: any) {
    item.appPrice = this.calculateAppPrice(Number(item.storePrice));
  }
  toggleItem(item: any) {
    if (!this.selectedStore) {
      this.common.alertmessage("Please select a store first", "Info", "info");
      return;
    }

    if (this.selectedItems.has(item._id)) {
      this.selectedItems.delete(item._id);
    } else {
      this.selectedItems.add(item._id);

      if (!item.isFromStore) {

        // ✅ SINGLE
        if (item.itemType === "single") {
          item.appPrice = this.calculateAppPrice(Number(item.storePrice));
        }

        // ✅ VARIANTS
        else if (item.itemType === "variant") {
          item.variantItems?.forEach((variant: any) => {
            variant.appPrice = this.calculateAppPrice(
              Number(variant.storePrice)
            );

            // ✅ ADD THIS (IMPORTANT)
            variant.itemQuestions?.forEach((q: any) => {
              q.options?.forEach((opt: any) => {
                opt.appPrice = this.calculateAppPrice(Number(opt.storePrice));
              });
            });

          });
        }

        // ✅ ADDONS
        item.addons?.forEach((addon: any) => {
          addon.appPrice = this.calculateAppPrice(Number(addon.storePrice));
        });

        // 🔥✅ CUSTOM QUESTIONS (FIX)
        item.itemQuestions?.forEach((q: any) => {
          q.options?.forEach((opt: any) => {
            opt.appPrice = this.calculateAppPrice(Number(opt.storePrice));
          });
        });
      }
    }
  }
 selectAll() {
  if (!this.selectedStore) {
    this.common.alertmessage("Please select a store first", "Info", "info");
    return;
  }

  this.generalItems.forEach(item => {
    this.selectedItems.add(item._id);

    if (!item.isFromStore) {

      // ✅ SINGLE
      if (item.itemType === "single") {
        item.appPrice = this.calculateAppPrice(Number(item.storePrice));
      }

      // ✅ VARIANTS
      else if (item.itemType === "variant") {
        item.variantItems?.forEach((variant: any) => {
          variant.appPrice = this.calculateAppPrice(
            Number(variant.storePrice)
          );

          // 🔥 FIX: Variant Questions
          variant.itemQuestions?.forEach((q: any) => {
            q.options?.forEach((opt: any) => {
              opt.appPrice = this.calculateAppPrice(Number(opt.storePrice));
            });
          });

        });
      }

      // ✅ ADDONS
      item.addons?.forEach((addon: any) => {
        addon.appPrice = this.calculateAppPrice(Number(addon.storePrice));
      });

      // 🔥 FIX: MAIN ITEM QUESTIONS
      item.itemQuestions?.forEach((q: any) => {
        q.options?.forEach((opt: any) => {
          opt.appPrice = this.calculateAppPrice(Number(opt.storePrice));
        });
      });

    }
  });
}
  unselectAll() {
    this.selectedItems.clear();
  }
  save() {
    if (!this.selectedStore) {
      this.common.alertmessage("Please select a store", 'warning', 'warning');
      return;
    }

    this.isLoading = true;

    const selectedData = this.generalItems
      .filter(item => this.selectedItems.has(item._id))
      .map(item => ({
        itemId: item._id,
        itemType: item.itemType,
        storePrice: item.storePrice,
        appPrice: item.appPrice,
        itemQuestions: item.itemQuestions || [],

        variants: item.variantItems?.map((v: any) => ({
          variantId: v._id,
          storePrice: v.storePrice,
          appPrice: v.appPrice,

          // ✅ ADD THIS (MAIN FIX)
          itemQuestions: v.itemQuestions || []

        })) || [],


        // ✅ ADDONS (THIS WAS MISSING ❗)
        addons: item.addons?.map((a: any) => ({
          addonId: a._id,
          storePrice: a.storePrice || 0,
          appPrice: a.appPrice || 0
        })) || []
      }));

    const payload = {
      storeId: this.selectedStore,
      adminId: this.adminId,
      selectedItems: selectedData,
      categoryId: this.selectedCategory
    };

    this.service.mapItems(payload).subscribe((res: any) => {
      if (res.success) {
        this.common.alertmessage(res.message, 'Success', 'success');
      } else {
        this.isLoading = false;
        this.common.alertmessage(res.message, 'Error', 'error');
      }

      this.loadStoreItems(true);
    });
  }

}
