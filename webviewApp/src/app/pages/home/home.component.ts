import { Component, OnInit } from '@angular/core';


@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent   {
 

  isLoading = true;

  constructor() { }

  onLoad() {
    this.isLoading = false;
  }
}