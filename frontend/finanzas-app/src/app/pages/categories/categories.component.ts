//  frontend/finanzas-app/src/app/pages/categories/categories.component.ts
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
    name = '';
    description = '';

    constructor(private categoryService: CategoryService) { }

    ngOnInit(): void {
        this.loadCategories();
    }

    loadCategories() {
        this.categoryService.getCategories().subscribe(data => this.categories = data);
    }

    addCategory() {
        if (!this.name) return;
        this.categoryService.createCategory({ name: this.name, description: this.description })
            .subscribe(() => {
                this.name = '';
                this.description = '';
                this.loadCategories();
            });
    }

    deleteCategory(id: string) {
        this.categoryService.deleteCategory(id).subscribe(() => this.loadCategories());
    }

    currentCategoryId: string | null = null;

    editCategory(category: Category) {
        this.name = category.name;
        this.description = category.description ?? '';
        this.currentCategoryId = category.id;
    }

    submitForm() {
        if (this.currentCategoryId) {
            this.categoryService.updateCategory(this.currentCategoryId, { name: this.name, description: this.description })
                .subscribe(updatedCategory => {
                    const idx = this.categories.findIndex(c => c.id === updatedCategory.id);
                    if (idx >= 0) this.categories[idx] = updatedCategory;
                    this.resetForm();
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
}

