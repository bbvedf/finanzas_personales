// src/app/core/components/navbar/navbar.component.ts
import { Component } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {
  isOpen = false;
  currentTheme = 'light';

  constructor(private themeService: ThemeService, private router: Router) {
    this.themeService.theme$.subscribe(theme => this.currentTheme = theme);
  }

  toggleMenu() {
    console.log('Toggle menu clicked');
    this.isOpen = !this.isOpen;
  }

  closeMenu() {
    this.isOpen = false;
  }

  setTheme(theme: string) {
    console.log('NavbarComponent calls setTheme with', theme);
    this.themeService.setTheme(theme);
    this.closeMenu();
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
    this.closeMenu();
  }

toggleTheme() {
  const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
  this.setTheme(newTheme);
}
  
  // --- NUEVOS MÉTODOS PARA NAVEGACIÓN A REACT ---
  goToDashboard() {
    window.location.href = '/dashboard';
    this.closeMenu();
  }

  goToUsers() {
    window.location.href = '/dashboard?tab=configuracion';
    this.closeMenu();
  }

  goToCompoundInterest() {
    window.location.href = '/dashboard?tab=calculadora';
    this.closeMenu();
  }

  goToMortgage() {
    window.location.href = '/dashboard?tab=mortgage';
    this.closeMenu();
  }

  logout() {
    if (window.AuthBridge?.clearAuth) {
      window.AuthBridge.clearAuth();
    }
    window.location.href = '/login';
    this.closeMenu();
  }
}