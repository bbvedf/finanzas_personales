// frontend/finanzas-app/src/app/pages/users/users.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../core/services/user.service';
import { User } from '../../core/models/user.model';

@Component({
    selector: 'app-users',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule
    ],
    templateUrl: './users.component.html',
    styleUrls: ['./users.component.scss']
})
export class UsersComponent implements OnInit {
    users: User[] = [];
    username = '';
    email = '';
    editingUser: User | null = null;

    constructor(private userService: UserService) { }

    ngOnInit(): void {
        this.loadUsers();
    }

    loadUsers() {
        this.userService.getUsers().subscribe(data => this.users = data);
    }

    addUser() {
        if (!this.username || !this.email) return;
        this.userService.createUser({ username: this.username, email: this.email })
            .subscribe(() => {
                this.username = '';
                this.email = '';
                this.loadUsers();
            });
    }

    currentUserId: string | null = null; // null = añadir, no null = editar

    editUser(user: User) {
        this.username = user.username;
        this.email = user.email;
        this.currentUserId = user.id;
    }

    // llamada desde el botón del formulario
    submitForm() {
        if (this.currentUserId) {
            // editar
            this.userService.updateUser(this.currentUserId, { username: this.username, email: this.email })
                .subscribe(updatedUser => {
                    // actualizar lista
                    const idx = this.users.findIndex(u => u.id === updatedUser.id);
                    if (idx >= 0) {
                        this.users[idx] = updatedUser; // ya lo haces
                        // Esto fuerza a Angular a detectar cambios:
                        this.users = [...this.users];
                    }
                    this.resetForm();
                });
        } else {
            // añadir
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
}

