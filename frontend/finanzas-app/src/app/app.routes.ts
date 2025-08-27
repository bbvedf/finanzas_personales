// frontend/finanzas-app/src/app/app.routes.ts
import { Routes } from '@angular/router';
import { UsersComponent } from './pages/users/users.component';
import { CategoriesComponent } from './pages/categories/categories.component';
import { TransactionsComponent } from './pages/transactions/transactions.component';

export const routes: Routes = [
  { path: '', redirectTo: '/users', pathMatch: 'full' },  // ruta por defecto
  { path: 'users', component: UsersComponent },
  { path: 'categories', component: CategoriesComponent },
  { path: 'transactions', component: TransactionsComponent },
  { path: '**', redirectTo: '/users' }  // cualquier ruta desconocida
];
