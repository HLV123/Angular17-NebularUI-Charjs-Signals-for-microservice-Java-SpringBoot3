import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { User, DEMO_USERS, ROLE_PERMISSIONS, MENU_ITEMS, UserRole } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  currentUser = signal<User | null>(null);
  isLoggedIn = computed(() => !!this.currentUser());

  constructor(private router: Router) {
    const saved = localStorage.getItem('omni_user');
    if (saved) {
      this.currentUser.set(JSON.parse(saved));
    }
  }

  login(username: string, password: string): boolean {
    const user = DEMO_USERS.find(u => u.username === username);
    if (user && password === '123456') {
      this.currentUser.set(user);
      localStorage.setItem('omni_user', JSON.stringify(user));
      // Navigate to first allowed page for this role
      const firstPage = this.getFirstAllowedPage(user.role);
      this.router.navigate(['/' + firstPage]);
      return true;
    }
    return false;
  }

  logout(): void {
    this.currentUser.set(null);
    localStorage.removeItem('omni_user');
    this.router.navigate(['/login']);
  }

  hasAccess(pageKey: string): boolean {
    const user = this.currentUser();
    if (!user) return false;
    return ROLE_PERMISSIONS[pageKey]?.[user.role] ?? false;
  }

  getVisibleMenuItems() {
    const user = this.currentUser();
    if (!user) return [];
    return MENU_ITEMS.map(section => ({
      ...section,
      items: section.items.filter(item => ROLE_PERMISSIONS[item.key]?.[user.role])
    })).filter(section => section.items.length > 0);
  }

  getFirstAllowedPage(role: UserRole): string {
    // Custom default pages per role
    const defaults: Record<UserRole, string> = {
      SUPER_ADMIN: 'dashboard', ADMIN: 'dashboard', SALES_MGR: 'dashboard',
      INV_MGR: 'inventory', MKT_MGR: 'marketing', CS_AGENT: 'orders',
      CASHIER: 'orders', ANALYST: 'analytics'
    };
    return defaults[role] || 'dashboard';
  }
}
