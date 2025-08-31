// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { UsersComponent } from './pages/users/users.component';
import { CategoriesComponent } from './pages/categories/categories.component'; // Asegúrate de crearlo
import { TransactionsComponent } from './pages/transactions/transactions.component'; // Asegúrate de crearlo
import { StatsComponent } from './pages/stats/stats.component';
import { ByUserComponent } from './pages/stats/by-user.component';
import { ByCategoryComponent } from './pages/stats/by-category.component';
import { OverTimeComponent } from './pages/stats/over-time.component';

export const routes: Routes = [
  { path: 'users', component: UsersComponent },
  { path: 'categories', component: CategoriesComponent },
  { path: 'transactions', component: TransactionsComponent },
  {
    path: 'stats',
    children: [
      { path: '', component: StatsComponent }, // /stats
      { path: 'by-user', component: ByUserComponent }, // /stats/by-user
      { path: 'by-category', component: ByCategoryComponent }, // /stats/by-category
      { path: 'over-time', component: OverTimeComponent } // /stats/over-time
    ]
  },
  { path: '', redirectTo: '/users', pathMatch: 'full' }
];