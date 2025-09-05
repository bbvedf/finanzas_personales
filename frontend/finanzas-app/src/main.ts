import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import { authInterceptor } from './app/core/interceptors/auth.interceptor';
import { CategoryService } from './app/core/services/category.service';

// Función para cargar AuthBridge con Promise
async function loadAuthBridge(): Promise<void> {
  if (window.AuthBridge) return; // Ya está cargado
  
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = '/shared/auth-bridge.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load AuthBridge'));
    document.head.appendChild(script);
  });
}

// Cargar AuthBridge antes de bootstrap
loadAuthBridge()
  .then(() => {
    console.log('✅ AuthBridge loaded successfully');
    bootstrapApplication(AppComponent, {
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideRouter(routes),
        CategoryService
      ]
    });
  })
  .catch(error => {
    console.error('❌ AuthBridge loading failed:', error);
    // Redirigir al login de compra-venta si falla
    window.location.href = '/login?error=auth_failed';
  });