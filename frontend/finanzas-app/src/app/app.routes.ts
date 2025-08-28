// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { UsersComponent } from './pages/users/users.component';
import { CategoriesComponent } from './pages/categories/categories.component'; // Asegúrate de crearlo
import { TransactionsComponent } from './pages/transactions/transactions.component'; // Asegúrate de crearlo

export const routes: Routes = [
  { path: 'users', component: UsersComponent },
  { path: 'categories', component: CategoriesComponent },
  { path: 'transactions', component: TransactionsComponent },
  { path: '', redirectTo: '/users', pathMatch: 'full' }
];