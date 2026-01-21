import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ProductosComponent } from './productos/productos.component';
import { UsersAdminComponent } from './users-admin/users-admin.component';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    component: DashboardComponent
  },
  {
    path: 'productos',
    component: ProductosComponent
  },
  {
    path: 'users',
    component: UsersAdminComponent
  }
];