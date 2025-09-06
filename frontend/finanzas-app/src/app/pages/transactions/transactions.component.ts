import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PaginationComponent } from '../../shared/pagination/pagination.component';
import { TransactionService } from '../../core/services/transaction.service';
import { Transaction } from '../../core/models/transaction.model';
import { UserService } from '../../core/services/user.service';
import { CategoryService } from '../../core/services/category.service';
import { HttpClient } from '@angular/common/http';

@Component({
    selector: 'app-transactions',
    templateUrl: './transactions.component.html',
    styleUrls: ['./transactions.component.scss'],
    standalone: true,
    imports: [CommonModule, FormsModule, PaginationComponent],
    providers: [TransactionService, UserService, CategoryService],
})
export class TransactionsComponent implements OnInit {
    columns = [
        { key: 'username', label: 'Usuario' },
        { key: 'category_name', label: 'Categoría' },
        { key: 'amount', label: 'Monto' },
        { key: 'description', label: 'Descripción' },
        { key: 'date', label: 'Fecha' },
    ];

    filters: any = {
        username: { value: '', mode: 'contains', matchMode: 'all', sortDirection: null },
        category_name: { value: '', mode: 'contains', matchMode: 'all', sortDirection: null },
        amount: { min: null, max: null, sortDirection: null },
        description: { value: '', mode: 'contains', matchMode: 'all', sortDirection: null },
        date: { start: '', end: '', sortDirection: null },
    };
    tempFilters: any = null;
    activeFilter: string | null = null;

    transactions: Transaction[] = [];
    filteredTransactions: Transaction[] = [];
    pagedTransactions: Transaction[] = [];
    currentPage = 1;
    pageSize = 5;

    // formulario
    userId: number | null = null;
    userName: string = '';
    categoryId: string = '';
    categoryName: string = '';
    amount: number | null = null;
    description: string = '';
    date: string = '';
    currentTransactionId: string | null = null;

    // modal
    showDeleteModal = false;
    transactionToDelete: Transaction | null = null;

    // data para selects
    users: any[] = [];
    categories: any[] = [];

    constructor(
        private transactionService: TransactionService,
        private userService: UserService,
        private categoryService: CategoryService,
        private http: HttpClient
    ) { }

    ngOnInit(): void {
        this.loadTransactions();
        this.loadUsers();
        this.loadCategories();
    }

    loadTransactions(filters?: any): void {
        this.transactionService.getTransactionsFiltered(filters).subscribe((data) => {
            this.transactions = data;
            this.filteredTransactions = [...this.transactions];
            this.applyFilter();
        });
    }

    loadUsers(): void {
        this.http.get<{ users: any[] }>('/api/admin/users').subscribe(
            (response) => {
                this.users = response.users; // ← Extraemos el array de la propiedad "users"
            },
            (error) => {
                console.error('Error cargando usuarios admin:', error);
                if (error.status === 403 || error.status === 401) {
                    alert('Se requieren permisos de administrador');
                }
            }
        );
    }

    loadCategories(): void {
        this.categoryService.getCategories().subscribe(categories => {
            this.categories = categories;
        });
    }

    // FILTROS
    // Añadir propiedad para controlar modo móvil
    isMobile = window.innerWidth <= 768;

    toggleFilter(col: string) {
        this.activeFilter = col;
        this.tempFilters = JSON.parse(JSON.stringify(this.filters));

        if (this.isMobile) {
            // Scroll a la posición del filtro para móvil
            const thElement = document.querySelector(`th:has(.filter-overlay)`);
            thElement?.scrollIntoView({ behavior: 'smooth' });
        }
    }

    applyFilter() {
        if (this.tempFilters) {
            this.filters = JSON.parse(JSON.stringify(this.tempFilters));
            this.tempFilters = null;
        }
        this.activeFilter = null;

        this.filteredTransactions = this.transactions.filter((tx) => {
            const userMatch = this.applyTextFilter(tx.username, this.filters.username);
            const catMatch = this.applyTextFilter(tx.category_name, this.filters.category_name);
            const descMatch = this.applyTextFilter(tx.description, this.filters.description);
            const amountMatch =
                (this.filters.amount.min == null || tx.amount >= this.filters.amount.min) &&
                (this.filters.amount.max == null || tx.amount <= this.filters.amount.max);
            const dateMatch =
                (!this.filters.date.start || (tx.date !== null && tx.date >= this.filters.date.start)) &&
                (!this.filters.date.end || (tx.date !== null && tx.date <= this.filters.date.end));

            return userMatch && catMatch && descMatch && amountMatch && dateMatch;
        });

        this.applySort();
        this.currentPage = 1;
        this.updatePagedTransactions();
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

    filterGlobal(event: Event) {
        const query = (event.target as HTMLInputElement).value.toLowerCase();
        this.filteredTransactions = this.transactions.filter(
            (tx) =>
                tx.username.toLowerCase().includes(query) ||
                tx.category_name.toLowerCase().includes(query) ||
                tx.amount.toString().toLowerCase().includes(query) ||
                (tx.description ?? '').toLowerCase().includes(query)
        );
        this.currentPage = 1;
        this.updatePagedTransactions();
    }

    clearFilters() {
        this.filters = {
            username: { value: '', mode: 'contains', matchMode: 'all', sortDirection: null },
            category_name: { value: '', mode: 'contains', matchMode: 'all', sortDirection: null },
            amount: { min: null, max: null, sortDirection: null },
            description: { value: '', mode: 'contains', matchMode: 'all', sortDirection: null },
            date: { start: '', end: '', sortDirection: null },
        };
        this.tempFilters = null;
        this.activeFilter = null;
        this.filteredTransactions = [...this.transactions];
        this.currentPage = 1;
        this.updatePagedTransactions();
    }

    cancelFilter(): void {
        this.tempFilters = null;
        this.activeFilter = null;
    }

    // SORT
    toggleSort(col: string) {
        const current = this.filters[col]?.sortDirection;
        let newDir: 'asc' | 'desc' | null = null;
        if (current === 'asc') newDir = 'desc';
        else if (current === 'desc') newDir = null;
        else newDir = 'asc';
        this.filters[col].sortDirection = newDir;

        Object.keys(this.filters).forEach(key => {
            if (key !== col && this.filters[key]?.sortDirection) {
                this.filters[key].sortDirection = null;
            }
        });

        this.applySort();
    }

    applySort() {
        const activeCol = Object.keys(this.filters).find(col => this.filters[col]?.sortDirection);
        if (activeCol) {
            const dir = this.filters[activeCol].sortDirection;
            this.filteredTransactions.sort((a, b) => {
                const aValue = (a as any)[activeCol];
                const bValue = (b as any)[activeCol];
                if (aValue < bValue) return dir === 'asc' ? -1 : 1;
                if (aValue > bValue) return dir === 'asc' ? 1 : -1;
                return 0;
            });
        }
        this.currentPage = 1;
        this.updatePagedTransactions();
    }

    // PAGINACIÓN
    updatePagedTransactions() {
        const start = (this.currentPage - 1) * this.pageSize;
        const end = start + this.pageSize;
        this.pagedTransactions = this.filteredTransactions.slice(start, end);
    }

    // FORMULARIO
    resetForm() {
        this.userId = null;
        this.userName = '';
        this.categoryId = '';
        this.categoryName = '';
        this.amount = null;
        this.description = '';
        this.date = '';
        this.currentTransactionId = null;
    }

    submitForm() {
        // Si hay fecha, crear Date a medianoche en UTC
        let dateToSend: Date;

        if (this.date) {
            // Crear fecha en UTC a medianoche (00:00:00)
            const [year, month, day] = this.date.split('-');
            dateToSend = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)));
        } else {
            // Fecha actual en UTC
            const now = new Date();
            dateToSend = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
        }

        const tx = {
            user_id: this.userId!,
            category_id: this.categoryId,
            amount: this.amount!,
            description: this.description,
            date: dateToSend,
        };
        if (this.currentTransactionId) {
            this.transactionService.updateTransaction(this.currentTransactionId, tx).subscribe(() => {
                this.loadTransactions();
            });
        } else {
            this.transactionService.createTransaction(tx).subscribe(() => {
                this.loadTransactions();
            });
        }
        this.resetForm();
    }

    // ACCIONES    
    editTransaction(tx: Transaction) {
        this.currentTransactionId = tx.id;
        this.userId = tx.user_id;
        this.userName = tx.username;
        this.categoryId = tx.category_id;
        this.categoryName = tx.category_name;
        this.amount = tx.amount;
        this.description = tx.description ?? '';
        this.date = tx.date ? new Date(tx.date).toISOString().split('T')[0] : '';

        // Forzar update del select-box
        setTimeout(() => {
            // Esto activará el dropdown
            const userInput = document.getElementById('userInput') as HTMLInputElement;
            const categoryInput = document.getElementById('categoryInput') as HTMLInputElement;
            if (userInput) userInput.click();
            if (categoryInput) categoryInput.click();
        }, 100);
    }

    // Sólo para el html, que no pinta bien la fecha de BD.
    formatDateForDisplay(date: Date): string {
        if (!date) return '';

        // Convertir UTC a fecha local para display
        const localDate = new Date(date);
        localDate.setMinutes(localDate.getMinutes() + localDate.getTimezoneOffset());

        return localDate.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }


    handleDeleteClick(tx: Transaction) {
        this.transactionToDelete = tx;
        this.showDeleteModal = true;
    }

    closeDeleteModal() {
        this.showDeleteModal = false;
        this.transactionToDelete = null;
    }

    confirmDelete() {
        if (this.transactionToDelete) {
            this.transactionService.deleteTransaction(this.transactionToDelete.id).subscribe(() => {
                this.loadTransactions();
            });
        }
        this.closeDeleteModal();
    }


    onUserNameChange(): void {
        // Para select, el value viene directamente del option
        const foundUser = this.users.find(u => u.username === this.userName);
        this.userId = foundUser?.id || null;
    }

    onCategoryNameChange(): void {
        const foundCategory = this.categories.find(c => c.name === this.categoryName);
        this.categoryId = foundCategory?.id || '';
    }

}
