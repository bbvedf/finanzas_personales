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
        this.bridge?.clearAuth?.();
    }
}
