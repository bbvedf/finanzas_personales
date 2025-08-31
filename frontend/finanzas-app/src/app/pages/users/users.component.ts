import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../core/services/user.service';
import { User } from '../../core/models/user.model';
import { PaginationComponent } from '../../shared/pagination/pagination.component';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class UsersComponent implements OnInit {
  columns = [
    { key: 'username', label: 'Nombre de usuario' },
    { key: 'email', label: 'Email' }
  ];

  filters: any = {
    username: { value: '', mode: 'contains', matchMode: 'all', sortDirection: null },
    email: { value: '', mode: 'contains', matchMode: 'all', sortDirection: null }
  };
  tempFilters: any = null;
  activeFilter: string | null = null;

  users: User[] = [];
  filteredUsers: User[] = [];
  pagedUsers: User[] = [];
  currentPage = 1;
  pageSize = 5;

  username = '';
  email = '';
  currentUserId: string | null = null;

  showDeleteModal = false;
  userToDelete: User | null = null;

  sortField: string | null = null;
  sortDirection: 'asc' | 'desc' | null = null;

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.userService.getUsers().subscribe(data => {
      this.users = data;
      this.filteredUsers = [...this.users];
      this.applyFilter();
    });
  }

  addUser() {
    if (!this.username || !this.email) return;
    this.userService.createUser({ username: this.username, email: this.email })
      .subscribe(() => {
        this.resetForm();
        this.loadUsers();
      });
  }

  editUser(user: User) {
    this.username = user.username;
    this.email = user.email;
    this.currentUserId = user.id;
  }

  submitForm() {
    if (this.currentUserId) {
      this.userService.updateUser(this.currentUserId, { username: this.username, email: this.email })
        .subscribe(() => {
          this.resetForm();
          this.loadUsers();
        });
    } else {
      this.addUser();
    }
  }

  resetForm() {
    this.username = '';
    this.email = '';
    this.currentUserId = null;
  }

  deleteUser(id: string) {
    this.userService.deleteUser(id).subscribe(() => this.loadUsers());
  }

  handleDeleteClick(user: User) {
    this.userToDelete = user;
    this.showDeleteModal = true;
  }

  confirmDelete() {
    if (this.userToDelete) {
      this.userService.deleteUser(this.userToDelete.id).subscribe(() => {
        this.loadUsers();
        this.closeDeleteModal();
      });
    }
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.userToDelete = null;
  }

  // --- FILTROS ---
  toggleFilter(field: string): void {
    if (this.activeFilter === field) {
      this.cancelFilter();
    } else {
      this.activeFilter = field;
      this.tempFilters = JSON.parse(JSON.stringify(this.filters));
    }
  }

  applyFilter(): void {
    if (this.tempFilters) {
      this.filters = JSON.parse(JSON.stringify(this.tempFilters));
      this.tempFilters = null;
    }
    this.activeFilter = null;

    this.filteredUsers = this.users.filter(user => {
      const usernameMatch = this.applyTextFilter(user.username, this.filters.username);
      const emailMatch = this.applyTextFilter(user.email, this.filters.email);
      return usernameMatch && emailMatch;
    });

    this.applySort();
    this.currentPage = 1;
    this.updatePagedUsers();
  }

  applyTextFilter(value: string | undefined, filter: { value: string; mode: string; matchMode: string }): boolean {
    if (!filter.value || !value) return true;
    const val = value.toLowerCase();
    const filterVal = filter.value.toLowerCase();
    switch (filter.mode) {
      case 'contains': return val.includes(filterVal);
      case 'startsWith': return val.startsWith(filterVal);
      case 'endsWith': return val.endsWith(filterVal);
      case 'equals': return val === filterVal;
      default: return true;
    }
  }

  cancelFilter(): void {
    this.tempFilters = null;
    this.activeFilter = null;
  }

  filterGlobal(event: Event): void {
    const value = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredUsers = this.users.filter(user =>
      (user.username ?? '').toLowerCase().includes(value) ||
      (user.email ?? '').toLowerCase().includes(value)
    );

    this.applySort();
    this.currentPage = 1;
    this.updatePagedUsers();
  }

  clearFilters(): void {
    this.filters = {
      username: { value: '', mode: 'contains', matchMode: 'all', sortDirection: null },
      email: { value: '', mode: 'contains', matchMode: 'all', sortDirection: null }
    };
    this.tempFilters = null;
    this.activeFilter = null;
    this.filteredUsers = [...this.users];

    this.applySort();
    this.currentPage = 1;
    this.updatePagedUsers();
  }

  // --- SORT ---
  toggleSort(field: string) {
    const current = this.filters[field]?.sortDirection;
    let newDir: 'asc' | 'desc' | null = null;
    if (current === 'asc') newDir = 'desc';
    else if (current === 'desc') newDir = null;
    else newDir = 'asc';
    this.filters[field].sortDirection = newDir;

    // reset otros sorts
    Object.keys(this.filters).forEach(key => {
      if (key !== field && this.filters[key]?.sortDirection) {
        this.filters[key].sortDirection = null;
      }
    });

    this.applySort();
  }

  applySort() {
    const activeCol = Object.keys(this.filters).find(col => this.filters[col]?.sortDirection);
    if (activeCol) {
      const dir = this.filters[activeCol].sortDirection;
      this.filteredUsers.sort((a, b) => {
        const aValue = (a as any)[activeCol];
        const bValue = (b as any)[activeCol];
        if (aValue < bValue) return dir === 'asc' ? -1 : 1;
        if (aValue > bValue) return dir === 'asc' ? 1 : -1;
        return 0;
      });
    }
    this.currentPage = 1;
    this.updatePagedUsers();
  }

  // --- PAGINACIÓN ---
  updatePagedUsers() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.pagedUsers = this.filteredUsers.slice(start, end);
  }
}
