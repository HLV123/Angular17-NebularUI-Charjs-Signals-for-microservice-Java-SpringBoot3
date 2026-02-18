import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }

  // Check page-level permission
  const pageKey = route.data?.['pageKey'] as string;
  if (pageKey && !auth.hasAccess(pageKey)) {
    const first = auth.getFirstAllowedPage(auth.currentUser()!.role);
    router.navigate(['/' + first]);
    return false;
  }

  return true;
};
