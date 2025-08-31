import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../../core/services/category.service';
import { Category } from '../../core/models/category.model';
import { PaginationComponent } from '../../shared/pagination/pagination.component';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.scss']
})
export class CategoriesComponent implements OnInit {
  columns = [
    { key: 'name', label: 'Nombre' },
    { key: 'description', label: 'Descripción' }
  ];

  filters: any = {
    name: { value: '', mode: 'contains', matchMode: 'all', sortDirection: null },
    description: { value: '', mode: 'contains', matchMode: 'all', sortDirection: null }
  };
  tempFilters: any = null;
  activeFilter: string | null = null;

  categories: Category[] = [];
  filteredCategories: Category[] = [];
  pagedCategories: Category[] = [];
  currentPage = 1;
  pageSize = 5;

  name = '';
  description = '';
  currentCategoryId: string | null = null;

  showDeleteModal = false;
  categoryToDelete: Category | null = null;

  constructor(private categoryService: CategoryService) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
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

  deleteCategory(id: string) {
    this.categoryService.deleteCategory(id).subscribe(() => this.loadCategories());
  }

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

    this.filteredCategories = this.categories.filter(cat => {
      const nameMatch = this.applyTextFilter(cat.name, this.filters.name);
      const descMatch = this.applyTextFilter(cat.description, this.filters.description);
      return nameMatch && descMatch;
    });

    this.applySort();
    this.currentPage = 1;
    this.updatePagedCategories();
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

  cancelFilter() {
    this.tempFilters = null;
    this.activeFilter = null;
  }

  filterGlobal(event: Event) {
    const value = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredCategories = this.categories.filter(cat =>
      (cat.name ?? '').toLowerCase().includes(value) ||
      (cat.description ?? '').toLowerCase().includes(value)
    );

    this.applySort();
    this.currentPage = 1;
    this.updatePagedCategories();
  }

  clearFilters() {
    this.filters = {
      name: { value: '', mode: 'contains', matchMode: 'all', sortDirection: null },
      description: { value: '', mode: 'contains', matchMode: 'all', sortDirection: null }
    };
    this.tempFilters = null;
    this.activeFilter = null;
    this.filteredCategories = [...this.categories];

    this.applySort();
    this.currentPage = 1;
    this.updatePagedCategories();
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
      this.filteredCategories.sort((a, b) => {
        const aValue = (a as any)[activeCol];
        const bValue = (b as any)[activeCol];
        if (aValue < bValue) return dir === 'asc' ? -1 : 1;
        if (aValue > bValue) return dir === 'asc' ? 1 : -1;
        return 0;
      });
    }
    this.currentPage = 1;
    this.updatePagedCategories();
  }

  // --- PAGINACIÓN ---
  updatePagedCategories() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.pagedCategories = this.filteredCategories.slice(start, end);
  }
}
