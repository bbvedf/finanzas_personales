// frontend/finanzas-app/src/app/core/services/auth.service.ts
import { Injectable } from '@angular/core';

declare global {
    interface Window {
        AuthBridge: any;
    }
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private get bridge() {
        return window.AuthBridge;
    }

    /** Verifica si el usuario está autenticado */
    isAuthenticated(): boolean {
        return this.bridge?.isAuthenticated?.() || false;
    }

    /** Devuelve el JWT */
    getToken(): string | null {
        return this.bridge?.getToken?.() || localStorage.getItem('token');
    }

    /** Versión sincronza para el interceptor */
    getTokenSync(): string | null {
        return window.AuthBridge?.getToken() || localStorage.getItem('token');
    }

    /** Devuelve los datos del usuario */
    getUserData(): any {
        return this.bridge?.getUserData?.() || null;
    }

    /** Logout global */
    logout(): void {
        // Limpiar AuthBridge
        this.bridge?.clearAuth?.();
        
        // Limpiar localStorage de Finanzas
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Eliminar cookies (similar a Contactos)
        this.clearCookies();
        
        // Redirigir a login de Compras (no a dashboard)
        window.location.href = 'https://ryzenpc.mooo.com/#/login?force_logout=true&from=finanzas';
    }

    private clearCookies(): void {
        const cookies = ['compras_token', 'token', 'auth_token', 'laravel_session', 'XSRF-TOKEN'];
        const paths = ['/', '/finanzas'];
        
        cookies.forEach(cookie => {
            paths.forEach(path => {
                document.cookie = `${cookie}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path};`;
            });
        });
    }
}
