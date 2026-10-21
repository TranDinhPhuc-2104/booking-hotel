import { Routes } from '@angular/router';
import { authGuard, guestGuard, roleGuard } from './core/auth/guards';

const staff = roleGuard(['MANAGER', 'ADMIN']);
const admin = roleGuard(['ADMIN']);

export const routes: Routes = [
  {
    path: '',
    title: 'Hotels',
    loadComponent: () => import('./features/public/hotel-list').then((m) => m.HotelList),
  },
  {
    path: 'hotels/:id',
    title: 'Hotel',
    loadComponent: () => import('./features/public/hotel-detail').then((m) => m.HotelDetailPage),
  },
  {
    path: 'login',
    title: 'Login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login').then((m) => m.Login),
  },
  {
    path: 'register',
    title: 'Register',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/register').then((m) => m.Register),
  },
  {
    path: 'bookings',
    title: 'My bookings',
    canActivate: [authGuard],
    loadComponent: () => import('./features/customer/my-bookings').then((m) => m.MyBookings),
  },
  {
    path: 'manager',
    title: 'My hotels',
    canActivate: [staff],
    loadComponent: () => import('./features/manager/manager-hotels').then((m) => m.ManagerHotels),
  },
  {
    path: 'manager/hotels/:id',
    title: 'Manage hotel',
    canActivate: [staff],
    loadComponent: () => import('./features/manager/manager-hotel').then((m) => m.ManagerHotel),
  },
  {
    path: 'admin/users',
    title: 'Users',
    canActivate: [admin],
    loadComponent: () => import('./features/admin/admin-users').then((m) => m.AdminUsers),
  },
  {
    path: 'admin/hotels',
    title: 'All hotels',
    canActivate: [admin],
    loadComponent: () => import('./features/admin/admin-hotels').then((m) => m.AdminHotels),
  },
  {
    path: '**',
    title: 'Not found',
    loadComponent: () => import('./features/public/not-found').then((m) => m.NotFound),
  },
];
