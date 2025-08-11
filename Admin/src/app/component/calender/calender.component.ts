import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  templateUrl: './calender.component.html',
})
export class CalenderComponent implements OnInit, OnDestroy {
  private routerSubscription: Subscription;

  constructor(private router: Router) {}

  ngOnInit() {
    // Lắng nghe điều hướng đến chính route này
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        if (event.urlAfterRedirects === '/calender') {
          this.reloadCalendar();
        }
      });
  }

  reloadCalendar() {
    console.log('Reloading calendar logic...');
    // Thêm logic làm mới dữ liệu ở đây
  }

  ngOnDestroy() {
    this.routerSubscription?.unsubscribe(); // tránh memory leak
  }
}
