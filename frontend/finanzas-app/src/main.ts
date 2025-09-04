// frontend/finanzas-app/src/main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import { authInterceptor } from './app/core/interceptors/auth.interceptor';
import { CategoryService } from './app/core/services/category.service';

// Verificar que AuthBridge esté cargado antes de bootstrap
if (!window.AuthBridge) {
  console.error('❌ AuthBridge no está disponible');
  // Puedes redirigir al login principal o mostrar error
}

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(withInterceptors([authInterceptor])),
    provideRouter(routes),
    CategoryService
  ]
});