// frontend/finanzas-app/src/app/pages/users/users.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../core/services/user.service';
import { User } from '../../core/models/user.model';

@Component({
    selector: 'app-users',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './users.component.html',
    styleUrls: ['./users.component.scss']
})
export class UsersComponent implements OnInit {
    users: User[] = [];
    filteredUsers: User[] = [];

    username = '';
    email = '';
    currentUserId: string | null = null;

    // --- SISTEMA DE FILTROS ---
    activeFilter: string | null = null;
    filters: any = {
        username: { value: '', mode: 'contains', matchMode: 'all' },
        email: { value: '', mode: 'contains', matchMode: 'all' }
    };
    tempFilters: any = null;

    constructor(private userService: UserService) { }

    ngOnInit(): void {
        this.loadUsers();
    }

    loadUsers() {
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

    // Modal de confirmación para eliminar usuario
    showDeleteModal = false;
    userToDelete: User | null = null;

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



    // --- SISTEMA DE FILTROS ---
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
        const input = event.target as HTMLInputElement;
        const value = input.value.toLowerCase();

        this.filteredUsers = this.users.filter(user =>
            (user.username || '').toLowerCase().includes(value) ||
            (user.email || '').toLowerCase().includes(value)
        );
    }

    clearFilters(): void {
        this.filters = {
            username: { value: '', mode: 'contains', matchMode: 'all' },
            email: { value: '', mode: 'contains', matchMode: 'all' }
        };
        this.tempFilters = null;
        this.activeFilter = null;
        this.filteredUsers = [...this.users];
    }
}
