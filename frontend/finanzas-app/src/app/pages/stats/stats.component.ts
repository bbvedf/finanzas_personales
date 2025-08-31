import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ByCategoryComponent } from './by-category.component';
import { ByUserComponent } from './by-user.component';
import { OverTimeComponent } from './over-time.component';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [
    CommonModule,
    ByCategoryComponent,
    ByUserComponent,
    OverTimeComponent
  ],
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.scss']
})
export class StatsComponent {}
