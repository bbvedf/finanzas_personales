// frontend/finanzas-app/src/app/core/interceptors/auth.interceptor.ts
import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  const token = authService.getTokenSync();
  console.log('🔑 Interceptor ejecutado, token:', token ? `${token.substring(0, 20)}...` : 'No encontrado');
  console.log('📡 URL de la petición:', req.url);

  if (token) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('✅ Header Authorization añadido');
    return next(cloned);
  } else {
    console.log('❌ Sin token, petición sin autorización');
    return next(req);
  }
};
