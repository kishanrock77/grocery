


import { Component, OnInit } from '@angular/core';

import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ApiService } from '../services/api';
import { AuthService } from '../services/auth';
import { Common } from '../services/common';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-additem',
  imports: [CommonModule, ReactiveFormsModule, RouterModule, FormsModule],
  templateUrl: './additem.html',
  styleUrl: './additem.css',
})
export class AddItemComponent implements OnInit {

  constructor(private api: ApiService, public common: Common,
    private auth: AuthService,
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.auth.isloggedIn() || this.router.navigate(['/login']);
    let session = this.auth.getSession();
    session.userType === 'admin' || session.userType === 'store' || this.router.navigate(['/login']);


  }

  itemId: any = null;
  isLoading = false;
  submitted = false;
  itemType: string = 'single'; vegtype: string = 'veg';

  variant_or_addon: string = '';
  // Form Model
  form: any = {
    itemName: '',
    itemSubName: '',
    description: '',
    storePrice: null, size: '',
    appPrice: null,
    useThisItemAsChild: false,
    showOnFront: true,
    // ✅ NEW
    unit: '',
    itemQuestions: []
  };

  // Category Lists
  categories: any[] = [];
  level1List: any[] = [];
  level2List: any[] = [];
  level3List: any[] = [];
  level2ListToShow: any[] = [];
  level3ListToShow: any[] = [];

  selectedCategory: any = {};
  selectedCategories: any[] = [];
  filterKeys: any[] = [];

  // Variants
  childItems: any[] = [];
  selectedVariants: any[] = [];

  // addons
  addonsItems: any[] = [];
  selectedAddons: any[] = [];

  // Images
  selectedFiles: File[] = [];
  selectedFiles2: any[] = [];
  imagePreviews: any[] = [];
  imagePreviews2: any[] = [];
  storeid: any = undefined;
  ngOnInit(): void {
    this.itemId = this.route.snapshot.paramMap.get('id');
    this.loadCategories();
    const session = this.auth.getSession();
    if (session.userType === 'store') {
      this.storeid = session.storeId;
      this.getstoredetails(this.storeid);
    } else {
      if (this.itemId) {
        this.getItemDetail();
      }
    }


  }
  // ===== ITEM QUESTIONS =====

  addQuestion() {
    this.form.itemQuestions.push({
      title: '',
      options: [{ label: '', price: 0 }]
    });
  }

  removeQuestion(i: number) {
    this.form.itemQuestions.splice(i, 1);
  }

  addOption(q: any) {
    q.options.push({
      label: '',
      storePrice: '',
      appPrice: ''
    });
  }
  updateOptionAppPrice(opt: any) {
    if (this.storeid && this.storedata?.increasepriceby) {
      const inc = (opt.storePrice * this.storedata.increasepriceby) / 100;
      opt.appPrice = opt.storePrice + inc;
    }
  }
  removeOption(q: any, i: number) {
    q.options.splice(i, 1);
  }
  // ================= LOAD CATEGORIES =================
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

    // Filter Keys जोड़ें
    if (selectedCat && selectedCat.filtersforlevel3category) {
      selectedCat.filtersforlevel3category.forEach((key: string) => {
        const existsKey = this.filterKeys.some(
          (k: any) => k.key === key
        );

        if (!existsKey) {
          this.filterKeys.push({
            key: key,
            value: '',
            categoryId: level3
          });
        }
      });
    }

    // Reset dropdowns
    this.selectedCategory = {};
    this.level2ListToShow = [];
    this.level3ListToShow = [];
    this.loadChildItems();
    this.loadAddonsItems();

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

    // उस Category की Filter Keys हटाएँ
    this.filterKeys = this.filterKeys.filter(
      (key: any) => key.categoryId !== level3Id
    );
    this.loadChildItems();
    this.loadAddonsItems();
  }

  // ================= VARIANTS =================


  loadAddonsItems() {

    let session = this.auth.getSession();

    console.log(session)
    let userId = session.userId;
    let userType = session.userType;
    let adminId = this.auth.getAdminId();
    let storeId = session.storeId;
    if (this.form.storeId) {
      storeId = this.form.storeId;
      userType = 'store';
    }
    this.api.getAddonItems(this.selectedCategories, userType, adminId, storeId).subscribe({
      next: (res: any) => {

        this.addonsItems = res.data;
      },
      error: () => {
        this.common.alertmessage(
          'Failed to load child items',
          'Error',
          'error'
        );
      }
    });
  }
  loadChildItems() {

    let session = this.auth.getSession();
    let userId = session.userId;
    let userType = session.userType;
    let adminId = this.auth.getAdminId();
    let storeId = session.storeId;

    if (this.form.storeId) {
      storeId = this.form.storeId;
      userType = 'store';
    }
    this.api.getChildItems(this.selectedCategories, userType, adminId, storeId).subscribe({
      next: (res: any) => {
        this.childItems = res.data;

      },
      error: () => {
        this.common.alertmessage(
          'Failed to load child items',
          'Error',
          'error'
        );
      }
    });
  }

  onVariantChange(event: any, id: string) {
    if (event.target.checked) {
      this.selectedVariants.push(id);
    } else {
      this.selectedVariants = this.selectedVariants.filter(x => x !== id);
    }
  }

  onAddonChange(event: any, id: string) {
    if (event.target.checked) {
      this.selectedAddons.push(id);
    } else {
      this.selectedAddons = this.selectedAddons.filter(x => x !== id);
    }
  }
  // ================= IMAGE UPLOAD =================
  onFileChange(event: any) {
    const files = Array.from(event.target.files) as File[];

    if (!files.length) return;

    // कुल फाइलों की सीमा जांचें
    if (this.selectedFiles2.length + this.selectedFiles.length + files.length > 5) {
      this.common.alertmessage('Maximum 5 images allowed', 'Warning', 'warning');
      return;
    }

    files.forEach((file: File) => {
      // डुप्लिकेट फाइल रोकें
      const alreadyExists = this.selectedFiles.some(
        f => f.name === file.name && f.size === file.size
      );

      if (alreadyExists) return;

      // साइज वैलिडेशन (2MB)
      if (file.size > 2 * 1024 * 1024) {
        this.common.alertmessage(`File "${file.name}" must be less than 2MB`, 'Warning', 'warning');
        return;
      }

      // टाइप वैलिडेशन
      if (!file.type.startsWith('image/')) {
        this.common.alertmessage(`"${file.name}" is not a valid image`, 'Warning', 'warning');
        return;
      }

      // फाइल जोड़ें
      this.selectedFiles.push(file);

      // प्रीव्यू बनाएं
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreviews.push(e.target.result);
      };
      reader.readAsDataURL(file);
    });

    // उसी फाइल को फिर से चुनने की अनुमति
    event.target.value = '';
  }
  removeImage(index: number) {
    this.selectedFiles.splice(index, 1);
    this.imagePreviews.splice(index, 1);
  }
  removeImageold(index: number) {
    this.selectedFiles2.splice(index, 1);
    this.imagePreviews2.splice(index, 1);
  }
  // ================= GET ITEM DETAIL =================
  parentIdArr: any[] = [];
  getItemDetail() {
    this.api.getItemDetail(this.itemId).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (!res.success) {
          this.common.alertmessage('Failed to load item', 'Error', 'error');
          this.cancelItem();
          return;
        }
        const data = res.data;
        this.form = data;
        this.form.unit = data.unit || '';
        this.form.size = data.size || '';
        this.form.itemQuestions = data.itemQuestions || [];
        this.itemType = data.itemType;
        this.vegtype = data.vegtype;

        this.variant_or_addon = data.variant_or_addon;
        if (this.form.storeId) {
          if (this.itemType === 'single') {
            if (!this.form.appPrice) {
              if (this.storedata && this.storedata.increasepriceby) {
                const inc = (this.form.storePrice * this.storedata.increasepriceby) / 100;
                this.form.appPrice = this.form.storePrice + inc;
              }
            }
          }
        }
        this.parentIdArr = data.parentId || [];
        this.selectedCategories = data.categories || [];
        this.filterKeys = data.filterKeys || [];
        data.images.forEach((img: string) => {
          this.imagePreviews2.push(img);
          this.selectedFiles2.push(img);
        });
        this.selectedVariants = data.variantItems || [];
        this.selectedAddons = data.addons || [];
        this.loadChildItems();
        this.loadAddonsItems();

      },
      error: () => {
        this.isLoading = false;
        this.common.alertmessage('Failed to load item', 'Error', 'error');
        this.cancelItem();
      }
    });
  }
  updateItemAppPrice() {

    if (this.itemType === 'single' && this.form.storePrice) {
      if (this.storeid) {

        if (this.storedata && this.storedata.increasepriceby) {
          const inc = (this.form.storePrice * this.storedata.increasepriceby) / 100;
          this.form.appPrice = this.form.storePrice + inc;
        }

      }
    }
  }
  storedata: any;
  getstoredetails(storeId: any) {

    this.isLoading = true;
    this.api.getStoreDetail(storeId).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.storedata = res.data;
          if (this.itemId) {
            this.getItemDetail();
          } else {
            this.isLoading = false;
          }
        } else {
          this.isLoading = false;
          this.common.alertmessage('Failed to fetch store details', 'Error', 'error');
        }
      },
      error: () => {
        this.isLoading = false;
        this.common.alertmessage('Failed to fetch store details', 'Error', 'error');
      }
    });
  }
  itemtypechange() {

    if (this.itemType == 'variant') {
      this.form.useThisItemAsChild = false;
      this.form.useThisItemAsChild = false;
      this.variant_or_addon = '';
    }
  }
  // ================= SAVE ITEM =================
  cancelItem() {
    if (window.opener) {
      // window.opener.location.reload();
    }

    // Close current window
    window.close();
  }
  saveItem() {
    this.submitted = true;

    // Basic Validation
    if (!this.form.itemName || !this.form.description) {
      return;
    }

    // Single Item Validation
    if (this.itemType === 'single') {
      if (!this.form.storePrice) return;
      if (this.form.storeId) {
        if (!this.form.appPrice) return;
      }

    }

    if (this.selectedCategories.length === 0) {
      return;
    }



    // remove empty questions
    this.form.itemQuestions = this.form.itemQuestions
      .filter((q: any) => q.title)
      .map((q: any) => ({
        title: q.title,
        options: (q.options || []).filter((o: any) => o.label)
      }));

    // Variant Validation
    if (this.itemType === 'variant' && this.selectedVariants.length === 0) {
      this.common.alertmessage(
        'Please select at least one variant item.',
        'Validation',
        'warning'
      );
      return;
    }

    if (this.itemType === 'single') {
      if (!this.form.unit) {
        this.common.alertmessage('Please select item unit', 'Validation',
          'warning')
        return;
      }
      if (!this.form.size) {
        this.common.alertmessage('Please enter item size', 'Validation',
          'warning')
        return;
      }
    }
    if (this.itemType === 'single') {
      this.selectedVariants = [];

    }
    if (this.form.useThisItemAsChild) {
      this.selectedAddons = [];
    }

    if (this.form.useThisItemAsChild) {
      if (!this.variant_or_addon) {
        this.common.alertmessage('Please select whether this item is a variant or an add-on.', 'Validation', 'warning');
        return;
      }
    } else {
      this.variant_or_addon = '';
    }
    const fd = new FormData();

    Object.keys(this.form).forEach(key => {
      if (key != 'size' && key != 'vegtype' && key != 'unit' && key != 'itemQuestions' && key != 'itemType' && key != 'variant_or_addon' && key != 'categories' && key != 'filterKeys' && key != 'variantItems' && key != 'addons') {
        fd.append(key, this.form[key]);
      }

    });
    if (this.itemType === 'single' && ((this.variant_or_addon == 'variant' && this.form.useThisItemAsChild) || (!this.form.useThisItemAsChild))) {

      for (let q of this.form.itemQuestions) {

        // ❌ title required
        if (!q.title) {
          this.common.alertmessage('Question title is required', 'Validation', 'warning');
          return;
        }

        for (let opt of q.options) {

          // ❌ option name required
          if (!opt.label) {
            this.common.alertmessage('Option name required', 'Validation', 'warning');
            return;
          }

          // ❌ store price required
          if (opt.storePrice === null || opt.storePrice === undefined) {
            this.common.alertmessage('Store price required', 'Validation', 'warning');
            return;
          }

          // ❌ app price required (only store user)
          if (this.storeid && (opt.appPrice === null || opt.appPrice === undefined)) {
            this.common.alertmessage('App price required', 'Validation', 'warning');
            return;
          }

        }
      }
    }
    fd.append('itemType', this.itemType); fd.append('vegtype', this.vegtype);


    fd.append('variant_or_addon', this.variant_or_addon);
    fd.append('categories', JSON.stringify(this.selectedCategories));
    fd.append('filterKeys', JSON.stringify(this.filterKeys));
    fd.append('variantItems', JSON.stringify(this.selectedVariants));
    fd.append('addons', JSON.stringify(this.selectedAddons));
    fd.append('oldimages', JSON.stringify(this.imagePreviews2));

    fd.append('itemQuestions', JSON.stringify(this.form.itemQuestions));
    fd.append('size', this.form.size || ''); fd.append('unit', this.form.unit || '');

    this.selectedFiles.forEach(file => {
      fd.append('images', file);
    });
    if (this.selectedFiles.length == 0 && this.imagePreviews2.length == 0) {
      this.common.alertmessage('Please select at least one image.', 'Validation', 'warning');
      return;

    }
    if (!this.itemId) {
      const session = this.auth.getSession();
      if (session.userType === 'store') {
        fd.append('addedBy', "" + this.auth.getAdminId());
        //  fd.append('addedBy', "" + session.userId);
        fd.append('addedByString', '' + session.userType);
        fd.append(
          'storeId',
          "" + session.storeId
        );
      } else if (session.userType === 'admin') {
        fd.append('addedBy', "" + this.auth.getAdminId());
        fd.append('addedByString', '' + session.userType);

      }
    }
    this.isLoading = true;


    this.api.addItem(fd, this.itemId).subscribe({
      next: (res: any) => {
        this.isLoading = false;

        if (res.success) {

          if (this.itemId) {
            this.common.alertmessage(
              'Item updated successfully!',
              'Success',
              'success'
            );
          } else {

            this.common.alertmessage(
              'Item saved successfully!',
              'Success',
              'success'
            );
            // Parent window refresh
            if (window.opener) {
              // window.opener.location.reload();
            }

            // Close current window
            window.close();
          }
        } else {
          this.common.alertmessage(res.message, 'Error', 'error');
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.common.alertmessage(
          'Something went wrong!',
          'Error',
          'error'
        );
        console.error(err);
      }
    });
  }
}