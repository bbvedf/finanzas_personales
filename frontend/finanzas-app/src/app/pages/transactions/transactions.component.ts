import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PaginationComponent } from '../../shared/pagination/pagination.component';
import { TransactionService } from '../../core/services/transaction.service';
import { Transaction } from '../../core/models/transaction.model';

@Component({
    selector: 'app-transactions',
    templateUrl: './transactions.component.html',
    styleUrls: ['./transactions.component.scss'],
    standalone: true,
    imports: [CommonModule, FormsModule, PaginationComponent],
    providers: [TransactionService],
})
export class TransactionsComponent implements OnInit {
    columns = [
        { key: 'user_id', label: 'Usuario' },
        { key: 'category_id', label: 'Categoría' },
        { key: 'amount', label: 'Monto' },
        { key: 'description', label: 'Descripción' },
        { key: 'date', label: 'Fecha' },
    ];

    filters: any = {
        user_id: { value: '', mode: 'contains', matchMode: 'all', sortDirection: null },
        category_id: { value: '', mode: 'contains', matchMode: 'all', sortDirection: null },
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
    userId: string = '';
    categoryId: string = '';
    amount: number | null = null;
    description: string = '';
    date: string = '';
    currentTransactionId: string | null = null;

    // modal
    showDeleteModal = false;
    transactionToDelete: Transaction | null = null;

    constructor(private transactionService: TransactionService) { }

    ngOnInit(): void {
        this.loadTransactions();
    }

    loadTransactions(): void {
        this.transactionService.getTransactions().subscribe((data) => {
            this.transactions = data;
            this.filteredTransactions = [...this.transactions];
            this.applyFilter();
        });
    }

    // --- FILTROS ---
    toggleFilter(col: string) {
        this.activeFilter = col;
        this.tempFilters = JSON.parse(JSON.stringify(this.filters));
    }

    applyFilter() {
        if (this.tempFilters) {
            this.filters = JSON.parse(JSON.stringify(this.tempFilters));
            this.tempFilters = null;
        }
        this.activeFilter = null;

        this.filteredTransactions = this.transactions.filter((tx) => {
            const userMatch = this.applyTextFilter(tx.user_id?.toString(), this.filters.user_id);
            const catMatch = this.applyTextFilter(tx.category_id?.toString(), this.filters.category_id);
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
                tx.user_id.toString().toLowerCase().includes(query) ||
                tx.category_id.toString().toLowerCase().includes(query) ||
                tx.amount.toString().toLowerCase().includes(query) ||
                (tx.description ?? '').toLowerCase().includes(query)
        );
        this.updatePagedTransactions();
    }

    clearFilters() {
        this.filters = {
            user_id: { value: '', mode: 'contains', matchMode: 'all', sortDirection: null },
            category_id: { value: '', mode: 'contains', matchMode: 'all', sortDirection: null },
            amount: { min: null, max: null, sortDirection: null },
            description: { value: '', mode: 'contains', matchMode: 'all', sortDirection: null },
            date: { start: '', end: '', sortDirection: null },
        };
        this.tempFilters = null;
        this.activeFilter = null;
        this.filteredTransactions = [...this.transactions];
        this.updatePagedTransactions();
    }

    cancelFilter(): void {
        this.tempFilters = null;
        this.activeFilter = null;
    }

    // --- SORT ---
    toggleSort(col: string) {
        const current = this.filters[col]?.sortDirection;
        let newDir: 'asc' | 'desc' | null = null;
        if (current === 'asc') newDir = 'desc';
        else if (current === 'desc') newDir = null;
        else newDir = 'asc';
        this.filters[col].sortDirection = newDir;

        // reset otros sorts
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
        this.updatePagedTransactions();
    }

    // --- PAGINACIÓN ---
    updatePagedTransactions() {
        const start = (this.currentPage - 1) * this.pageSize;
        const end = start + this.pageSize;
        this.pagedTransactions = this.filteredTransactions.slice(start, end);
    }

    // --- FORMULARIO ---
    resetForm() {
        this.userId = '';
        this.categoryId = '';
        this.amount = null;
        this.description = '';
        this.date = '';
        this.currentTransactionId = null;
    }

    submitForm() {
        if (this.currentTransactionId) {
            // update
        } else {
            // create
        }
        this.resetForm();
    }

    // --- ACCIONES ---
    editTransaction(tx: Transaction) {
        this.currentTransactionId = tx.id;
        this.userId = tx.user_id;
        this.categoryId = tx.category_id;
        this.amount = tx.amount;
        this.description = tx.description ?? '';
        this.date = tx.date ?? '';
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
            // eliminar aquí
        }
        this.closeDeleteModal();
    }
}
