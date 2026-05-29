import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Perfil } from '../models/auth.models';

export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const roles = (route.data?.['roles'] as Perfil[] | undefined) ?? [];

  if (roles.length === 0 || (authService.profile() && roles.includes(authService.profile()!.perfil))) {
    return true;
  }

  return router.createUrlTree(['/login']);
};
