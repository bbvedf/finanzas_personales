import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ThemeService } from '../../core/services/theme.service';
import { ByCategoryComponent } from './by-category.component';
import { ByUserComponent } from './by-user.component';
import { OverTimeComponent } from './over-time.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [CommonModule, ByCategoryComponent, ByUserComponent, OverTimeComponent],
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.scss']
})
export class StatsComponent implements OnInit, OnDestroy {
    currentTheme: 'light' | 'dark' = 'light';
    private themeSubscription: Subscription = new Subscription();

    constructor(
        private router: Router,
        private themeService: ThemeService
    ) { }

    ngOnInit(): void {
        // Suscribirse a los cambios de tema
        this.themeSubscription = this.themeService.theme$.subscribe((theme: string) => {
            this.currentTheme = theme as 'light' | 'dark';
        });
    }

    ngOnDestroy(): void {
        this.themeSubscription.unsubscribe();
    }

    navigateTo(path: string) {
        this.router.navigate([`/stats/${path}`]);
    }
}