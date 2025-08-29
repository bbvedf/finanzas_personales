// frontend/finanzas-app/src/app/pages/categories/categories.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../../core/services/category.service';
import { Category } from '../../core/models/category.model';

@Component({
    selector: 'app-categories',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './categories.component.html',
    styleUrls: ['./categories.component.scss']
})
export class CategoriesComponent implements OnInit {
    categories: Category[] = [];
    filteredCategories: Category[] = [];
    name = '';
    description = '';
    currentCategoryId: string | null = null;

    // Sistema de filtros
    activeFilter: string | null = null;
    filters: any = {
        name: { value: '', mode: 'contains', matchMode: 'all' },
        description: { value: '', mode: 'contains', matchMode: 'all' }
    };
    tempFilters: any = null;

    constructor(private categoryService: CategoryService) { }

    ngOnInit(): void {
        this.loadCategories();
    }

    loadCategories() {
        this.categoryService.getCategories().subscribe(data => {
            this.categories = data;
            this.filteredCategories = [...this.categories];
            this.applyFilter();
        });
    }

    addCategory() {
        if (!this.name) return;
        this.categoryService.createCategory({ name: this.name, description: this.description })
            .subscribe(() => {
                this.resetForm();
                this.loadCategories();
            });
    }

    deleteCategory(id: string) {
        this.categoryService.deleteCategory(id).subscribe(() => this.loadCategories());
    }

    // Modal de confirmación para eliminar
    showDeleteModal = false;
    categoryToDelete: Category | null = null;

    handleDeleteClick(category: Category) {
        this.categoryToDelete = category;
        this.showDeleteModal = true;
    }

    confirmDelete() {
        if (this.categoryToDelete) {
            this.categoryService.deleteCategory(this.categoryToDelete.id).subscribe(() => {
                this.loadCategories();
                this.closeDeleteModal();
            });
        }
    }

    closeDeleteModal() {
        this.showDeleteModal = false;
        this.categoryToDelete = null;
    }


    editCategory(category: Category) {
        this.name = category.name;
        this.description = category.description ?? '';
        this.currentCategoryId = category.id;
    }

    submitForm() {
        if (this.currentCategoryId) {
            this.categoryService.updateCategory(this.currentCategoryId, { name: this.name, description: this.description })
                .subscribe(() => {
                    this.resetForm();
                    this.loadCategories();
                });
        } else {
            this.addCategory();
        }
    }

    resetForm() {
        this.name = '';
        this.description = '';
        this.currentCategoryId = null;
    }

    // --- SISTEMA DE FILTROS (copiado de transactions) ---
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

        this.filteredCategories = this.categories.filter(category => {
            const nameMatch = this.applyTextFilter(category.name, this.filters.name);
            const descriptionMatch = this.applyTextFilter(category.description, this.filters.description);

            return nameMatch && descriptionMatch;
        });
    }

    applyTextFilter(value: string | undefined, filter: { value: string; mode: string; matchMode: string }): boolean {
        if (!filter.value || !value) return true;
        const val = value.toLowerCase();
        const filterVal = filter.value.toLowerCase();

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

        this.filteredCategories = this.categories.filter(category => {
            return (
                (category.name || '').toLowerCase().includes(value) ||
                (category.description || '').toLowerCase().includes(value)
            );
        });
    }

    clearFilters(): void {
        this.filters = {
            name: { value: '', mode: 'contains', matchMode: 'all' },
            description: { value: '', mode: 'contains', matchMode: 'all' }
        };
        this.tempFilters = null;
        this.activeFilter = null;
        this.filteredCategories = [...this.categories];
    }
}