import { ChangeDetectorRef, Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { User } from 'src/app/models/user.model';
import { UserService } from "src/app/services/user.service";

@Component({
    templateUrl: "./about.component.html",

  })
export class AboutComponent implements OnInit {

  constructor(
   
  ) {}
 
  ngOnInit(): void {
    const user = JSON.parse(localStorage.getItem('user'));
   
  }

    
}