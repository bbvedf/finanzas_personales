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
    console.log('Toggle menu clicked'); // Para depurar
    this.isOpen = !this.isOpen;
  }

  closeMenu() {
    this.isOpen = false;
  }

  setTheme(theme: string) {
    console.log('NavbarComponent calls setTheme with', theme);  // <--- prueba
    this.themeService.setTheme(theme);
    this.closeMenu();
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
    this.closeMenu();
  }
}