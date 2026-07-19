import { Component } from '@angular/core';
import { ApiService } from '../services/api';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { CommonModule } from '@angular/common';
import { Common } from '../services/common';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-itemcategory',
  imports: [CommonModule, FormsModule],
  templateUrl: './itemcategory.html',
  styleUrl: './itemcategory.css',
})
export class Itemcategory {
  constructor(
    private api: ApiService,
    private auth: AuthService,
    private router: Router,
    public common: Common
  ) { }
  form: any = {};
  keys: string[] = [];
  newKey: string = '';
  isLoading: any = false;
  list: any[] = [];
  level1List: any[] = [];
  level2List: any[] = [];

  ngOnInit() {

    this.auth.isloggedIn() || this.router.navigate(['/login']);
    let session = this.auth.getSession();
    session.userType === 'admin' || this.router.navigate(['/login']);
    this.loadCategories();
  }
  showForm = false;
  submitted = false;

  toggleForm() {
    this.showForm = true;
  }

  cancel() {
    this.showForm = false;
    this.form = {};
    this.submitted = false;
    this.keys = [];
  }
  getFullPath(cat: any): string {

    let level1: any = this.list.find((x: any) => x._id == cat.grandparent_id);
    let level2: any = this.list.find((x: any) => x._id == cat.parent_id);

    if (cat.level_no == 1) return cat.categoryName;

    if (cat.level_no == 2)
      return `${level1?.categoryName} -> ${cat.categoryName}`;

    if (cat.level_no == 3)
      return `${level1?.categoryName} -> ${level2?.categoryName} -> ${cat.categoryName}`;

    return "";
  }
  changelevel() {
    if (this.form.grandparent_id) {
      this.level2Listtoshow = this.level2List.filter(
        (x: any) => x.grandparent_id === this.form.grandparent_id
      );
    } else {
      this.level2Listtoshow = this.level2List;
    }
  }
  level2Listtoshow: any[] = [];
  loadCategories() {

    this.isLoading = true;
    const adminId = this.auth.getAdminId();

    this.api.loadCategories(adminId).subscribe((res: any) => {
      this.isLoading = false;
      this.level1List = res.filter((x: any) => x.level_no == 1);
      this.level2List = res.filter((x: any) => x.level_no == 2);
      this.level2Listtoshow = res.filter((x: any) => x.level_no == 2);
      this.list = res;
    }, error => {
      this.isLoading = false;
      this.common.alertmessage('Something went wrong !', 'error', 'error')
    });
  }
searchText: string = '';
  imagePreview: any = null;
get filteredList() {

  if (!this.searchText.trim()) {
    return this.list;
  }

  const text = this.searchText.toLowerCase();

  return this.list.filter((cat: any) => {

    // current category
    const current = cat.categoryName?.toLowerCase() || '';

    // full path
    const fullPath = this.getFullPath(cat).toLowerCase();

    return (
      current.includes(text) ||
      fullPath.includes(text)
    );
  });

}
  onFileSelect(event: any) {
    const file = event.target.files[0];

    if (file) {

      // validation (optional but recommended)
      if (!file.type.startsWith("image/")) {
        alert("Only image allowed");
        return;
      }

      this.form.image = file;

      // 🔥 preview generate
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
      };

      reader.readAsDataURL(file);
    }
  }

  // Add Key
  addKey() {
    if (this.newKey.trim() !== '') {
      this.keys.unshift(this.newKey); // reverse order (latest first)
      this.newKey = '';
    }
  }

  // Delete Key
  deleteKey(index: number) {
    this.keys.splice(index, 1);
    console.log(this.keys)
  }
  save() {
    this.submitted = true;


    // basic validation
    if (!this.form.level_no || !this.form.categoryName) return;

    if (this.form.level_no >= 2 && !this.form.grandparent_id) return;
    if (this.form.level_no == 3 && !this.form.parent_id) return;

    // 🖼️ IMAGE VALIDATION
    if (!this.form.image && !this.form._id) {
      // add case (no existing image)
      return;
    }
    this.isLoading = true;
    let fd = new FormData();
    this.form.addedBy = this.auth.getAdminId();
    if (this.form.level_no == 3) {
      console.log("b");
      console.log("mm", this.keys)
      this.form.filtersforlevel3category = this.keys;
    } else {
      console.log(44444444444)

      this.form.filtersforlevel3category = [];
    }

    for (let key in this.form) {
      fd.append(key, this.form[key]);
    }


    this.api.savecategory(fd, this.form._id).subscribe((res: any) => {
      this.isLoading = false;


      if (res.success) {
        this.common.alertmessage('Category saved successfully !', 'Success', 'success');

        this.cancel();
        this.form = {};
        this.imagePreview = '';
        this.submitted = false;
        this.keys = [];
        this.loadCategories();
      } else {
        this.common.alertmessage(res.message, 'error', 'error')
      }

    }, error => {
      this.isLoading = false;
      this.common.alertmessage('Something went wrong !', 'error', 'error')
    });
  }
  edit(data: any) {
    this.showForm = true;

    this.form = {
      _id: data._id,
      level_no: data.level_no,
      categoryName: data.categoryName,

      parent_id: data.parent_id,
      grandparent_id: data.grandparent_id,
      imagepath: data.imagepath
    };
    this.keys = data.filtersforlevel3category;
    this.imagePreview = null; // new image nahi selected
  }
  delete(id: string) {

    if (!confirm("Are you sure to delete?")) return;

    this.isLoading = true;

    this.api.deleteCategories(id).subscribe({
      next: (res: any) => {
        this.isLoading = false;

        if (res.success) {

          this.common.alertmessage('Deleted successfully !', 'Success', 'success')
          this.loadCategories();
        } else {
          this.common.alertmessage('Something went wrong !', 'error', 'error')
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error(err);
        this.common.alertmessage('Something went wrong !', 'error', 'error')
      }
    });
  }
}
