import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent) },
  {
    path: '',
    loadComponent: () => import('./layout/layout.component').then(m => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: 'dashboard',       loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),       data: { pageKey: 'dashboard' },       canActivate: [authGuard] },
      { path: 'products',        loadComponent: () => import('./pages/products/products.component').then(m => m.ProductsComponent),           data: { pageKey: 'products' },        canActivate: [authGuard] },
      { path: 'inventory',       loadComponent: () => import('./pages/inventory/inventory.component').then(m => m.InventoryComponent),        data: { pageKey: 'inventory' },       canActivate: [authGuard] },
      { path: 'orders',          loadComponent: () => import('./pages/orders/orders.component').then(m => m.OrdersComponent),                 data: { pageKey: 'orders' },          canActivate: [authGuard] },
      { path: 'crm',             loadComponent: () => import('./pages/crm/crm.component').then(m => m.CrmComponent),                         data: { pageKey: 'crm' },             canActivate: [authGuard] },
      { path: 'marketing',       loadComponent: () => import('./pages/marketing/marketing.component').then(m => m.MarketingComponent),        data: { pageKey: 'marketing' },       canActivate: [authGuard] },
      { path: 'omnichannel',     loadComponent: () => import('./pages/omnichannel/omnichannel.component').then(m => m.OmnichannelComponent),  data: { pageKey: 'omnichannel' },     canActivate: [authGuard] },
      { path: 'analytics',       loadComponent: () => import('./pages/analytics/analytics.component').then(m => m.AnalyticsComponent),        data: { pageKey: 'analytics' },       canActivate: [authGuard] },
      { path: 'finance',         loadComponent: () => import('./pages/finance/finance.component').then(m => m.FinanceComponent),              data: { pageKey: 'finance' },         canActivate: [authGuard] },
      { path: 'staff',           loadComponent: () => import('./pages/staff/staff.component').then(m => m.StaffComponent),                    data: { pageKey: 'staff' },           canActivate: [authGuard] },
      { path: 'notifications',   loadComponent: () => import('./pages/notifications/notifications.component').then(m => m.NotificationsComponent), data: { pageKey: 'notifications' }, canActivate: [authGuard] },
      { path: 'search',          loadComponent: () => import('./pages/search/search.component').then(m => m.SearchComponent),                 data: { pageKey: 'search' },          canActivate: [authGuard] },
      { path: 'data-governance', loadComponent: () => import('./pages/data-governance/data-governance.component').then(m => m.DataGovernanceComponent), data: { pageKey: 'data-governance' }, canActivate: [authGuard] },
      { path: 'pipeline',        loadComponent: () => import('./pages/pipeline/pipeline.component').then(m => m.PipelineComponent),           data: { pageKey: 'pipeline' },        canActivate: [authGuard] },
    ]
  },
  { path: '**', redirectTo: 'login' }
];
