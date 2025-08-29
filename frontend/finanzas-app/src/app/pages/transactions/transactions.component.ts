import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TransactionService } from '../../core/services/transaction.service';
import { Transaction } from '../../core/models/transaction.model';

@Component({
    selector: 'app-transactions',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './transactions.component.html',
    styleUrls: ['./transactions.component.scss']
})
export class TransactionsComponent implements OnInit {
    transactions: Transaction[] = [];
    filteredTransactions: Transaction[] = [];
    activeFilter: string | null = null;
    filters: any = {
        user_id: { value: '', mode: 'contains', matchMode: 'all' },
        category_id: { value: '', mode: 'contains', matchMode: 'all' },
        amount: { min: null, max: null },
        description: { value: '', mode: 'contains', matchMode: 'all' },
        date: { start: null, end: null }
    };
    tempFilters: any = null;

    userId = '';
    categoryId = '';
    date: string | null = null;
    amount: number | null = null;
    description = '';
    currentTransactionId: string | null = null;

    constructor(private transactionService: TransactionService) { }

    ngOnInit(): void {
        this.loadTransactions();
    }

    loadTransactions(): void {
        this.transactionService
            .getTransactionsFiltered({
                user_id: this.filters.user_id.value || undefined,
                category_id: this.filters.category_id.value || undefined,
                start_date: this.filters.date.start || undefined,
                end_date: this.filters.date.end || undefined
            })
            .subscribe(data => {
                console.log('Transacciones cargadas:', data);
                this.transactions = data.map(tx => ({
                    ...tx,
                    date: tx.date ? tx.date.split('T')[0] : null
                }));
                this.filteredTransactions = [...this.transactions];
                this.applyFilter();
            });
    }

    submitForm(): void {
        if (this.currentTransactionId) {
            this.updateTransaction();
        } else {
            this.addTransaction();
        }
    }

    addTransaction(): void {
        if (!this.userId || !this.categoryId || this.amount === null) return;
        this.transactionService
            .createTransaction({
                user_id: this.userId,
                category_id: this.categoryId,
                amount: this.amount,
                description: this.description,
                date: this.date ?? new Date().toISOString().split('T')[0]
            })
            .subscribe(() => {
                this.resetForm();
                this.loadTransactions();
            });
    }

    editTransaction(tx: Transaction): void {
        this.userId = tx.user_id;
        this.categoryId = tx.category_id;
        this.amount = tx.amount;
        this.description = tx.description ?? '';
        this.date = tx.date ? new Date(tx.date).toISOString().split('T')[0] : null;
        this.currentTransactionId = tx.id;
    }

    updateTransaction(): void {
        if (!this.currentTransactionId) return;
        this.transactionService
            .updateTransaction(this.currentTransactionId, {
                user_id: this.userId,
                category_id: this.categoryId,
                amount: this.amount ?? 0,
                description: this.description,
                date: this.date ?? new Date().toISOString().split('T')[0]
            })
            .subscribe(() => {
                this.resetForm();
                this.loadTransactions();
            });
    }

    deleteTransaction(id: string): void {
        this.transactionService.deleteTransaction(id).subscribe(() => this.loadTransactions());
    }

    showDeleteModal = false;
    transactionToDelete: any | null = null; // 👈 si tienes un modelo Transaction, ponlo en vez de any

    handleDeleteClick(transaction: any) {
        this.transactionToDelete = transaction;
        this.showDeleteModal = true;
    }

    confirmDelete(): void {
        if (this.transactionToDelete) {
            this.transactionService.deleteTransaction(this.transactionToDelete.id).subscribe(() => {
                this.loadTransactions();
                this.closeDeleteModal();
            });
        }
    }

    closeDeleteModal(): void {
        this.showDeleteModal = false;
        this.transactionToDelete = null;
    }


    resetForm(): void {
        this.userId = '';
        this.categoryId = '';
        this.amount = null;
        this.description = '';
        this.currentTransactionId = null;
        this.date = null;
    }

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

        console.log('Aplicando filtros:', this.filters);
        this.filteredTransactions = this.transactions.filter(tx => {
            const userIdMatch = this.applyTextFilter(tx.user_id, this.filters.user_id);
            const categoryIdMatch = this.applyTextFilter(tx.category_id, this.filters.category_id);
            const amountMatch = (!this.filters.amount.min || tx.amount >= this.filters.amount.min) &&
                (!this.filters.amount.max || tx.amount <= this.filters.amount.max);
            const descriptionMatch = this.applyTextFilter(tx.description, this.filters.description);
            const dateMatch =
                (!this.filters.date.start ||
                    (tx.date &&
                        new Date(tx.date) >= new Date(this.filters.date.start as string))) &&
                (!this.filters.date.end ||
                    (tx.date &&
                        new Date(tx.date) <= new Date(this.filters.date.end as string)));

            return userIdMatch && categoryIdMatch && amountMatch && descriptionMatch && dateMatch;
        });
        console.log('Transacciones filtradas:', this.filteredTransactions);
    }

    applyTextFilter(value: string | undefined, filter: { value: string; mode: string; matchMode: string }): boolean {
        if (!filter.value || !value) return true;
        const val = value.toLowerCase();
        const filterVal = filter.value.toLowerCase();

        console.log(`Filtrando ${value} con ${filterVal} en modo ${filter.mode}`);
        switch (filter.mode) {
            case 'contains':
                return val.includes(filterVal);
            case 'startsWith':
                return val.startsWith(filterVal);
            case 'endsWith':
                return val.endsWith(filterVal);
            case 'equals':
                return val === filterVal;
            default:
                return true;
        }
    }

    cancelFilter(): void {
        this.tempFilters = null;
        this.activeFilter = null;
    }

    filterGlobal(event: Event): void {
        const input = event.target as HTMLInputElement;
        const value = input.value.toLowerCase();
        console.log('Búsqueda global:', value);
        this.filteredTransactions = this.transactions.filter(tx => {
            return (
                (tx.user_id || '').toLowerCase().includes(value) ||
                (tx.category_id || '').toLowerCase().includes(value) ||
                (tx.amount?.toString() || '').includes(value) ||
                (tx.description || '').toLowerCase().includes(value) ||
                (tx.date || '').toLowerCase().includes(value)
            );
        });
        console.log('Resultados búsqueda global:', this.filteredTransactions);
    }

    clearFilters(): void {
        this.filters = {
            user_id: { value: '', mode: 'contains', matchMode: 'all' },
            category_id: { value: '', mode: 'contains', matchMode: 'all' },
            amount: { min: null, max: null },
            description: { value: '', mode: 'contains', matchMode: 'all' },
            date: { start: null, end: null }
        };
        this.tempFilters = null;
        this.activeFilter = null;
        this.loadTransactions();
    }
}