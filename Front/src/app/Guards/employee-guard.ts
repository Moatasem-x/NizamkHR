import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../Services/auth-service';
import { inject } from '@angular/core';

export const employeeGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  if (authService.authenticated() && authService.getRole() === "Employee") {
    return true;
  } 
  else if (authService.authenticated()) {
    router.navigate(['/hrdash']);
    return false;
  }
  router.navigate(['/login']);
  return false;
};
