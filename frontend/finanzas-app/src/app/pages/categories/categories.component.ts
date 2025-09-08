// frontend/finanzas-app/src/app/pages/categories/categories.component.ts
import { Component, OnInit, HostListener, ElementRef } from '@angular/core';
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
  styleUrls: ['./categories.component.scss'],
  providers: [CategoryService]
})
export class CategoriesComponent implements OnInit {
  columns = [
    { key: 'name', label: 'Nombre' },
    { key: 'description', label: 'Descripción' },
    { key: 'user_id', label: 'Usuario' }
  ];

  filters: any = {
    name: { value: '', mode: 'contains', matchMode: 'all', sortDirection: null },
    description: { value: '', mode: 'contains', matchMode: 'all', sortDirection: null },
    user_id: { value: '', mode: 'contains', matchMode: 'all', sortDirection: null }
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
  showExportMenu = false;
  isMobile = window.innerWidth <= 768;

  constructor(
    private categoryService: CategoryService,
    private elementRef: ElementRef
  ) { }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.showExportMenu = false;
    }
  }

  isRightEdge(): boolean {
    const exportBtn = this.elementRef.nativeElement.querySelector('.export-button');
    if (!exportBtn) return false;
    const rect = exportBtn.getBoundingClientRect();
    return rect.right + 150 > window.innerWidth;
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(filters?: any): void {
    this.categoryService.getCategoriesFiltered(filters).subscribe(data => {
      this.categories = data;
      this.filteredCategories = [...this.categories];
      this.currentPage = 1;
      this.updatePagedCategories();
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

  // FILTROS
  toggleFilter(col: string) {
    this.activeFilter = col;
    this.tempFilters = JSON.parse(JSON.stringify(this.filters));
    if (this.isMobile) {
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

    const backendFilters = {
      name: this.filters.name.value || undefined,
      description: this.filters.description.value || undefined
    };

    this.loadCategories(backendFilters);
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
    this.filteredCategories = this.categories.filter(cat =>
      (cat.name ?? '').toLowerCase().includes(query) ||
      (cat.description ?? '').toLowerCase().includes(query) ||
      (cat.user_id ?? '').toLowerCase().includes(query)
    );
    this.currentPage = 1;
    this.updatePagedCategories();
  }

  clearFilters() {
    this.filters = {
      name: { value: '', mode: 'contains', matchMode: 'all', sortDirection: null },
      description: { value: '', mode: 'contains', matchMode: 'all', sortDirection: null },
      user_id: { value: '', mode: 'contains', matchMode: 'all', sortDirection: null }
    };
    this.tempFilters = null;
    this.activeFilter = null;
    this.loadCategories();
  }

  cancelFilter() {
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

  // PAGINACIÓN
  updatePagedCategories() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.pagedCategories = this.filteredCategories.slice(start, end);
  }

  // EXPORTS
  private generateCSVFromData(categories: Category[]): string {
    let csvData = "Nombre,Descripción,Usuario\n";
    for (const cat of categories) {
      csvData += `"${cat.name}","${cat.description || ''}","${cat.user_id || ''}"\n`;
    }
    return csvData;
  }

  exportCSV() {
    const csvData = this.generateCSVFromData(this.filteredCategories);
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `categorias_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    this.showExportMenu = false;
  }

  async exportExcel() {
    try {
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Categorías');

      const titleRow = worksheet.addRow(['Reporte de Categorías']);
      titleRow.font = { bold: true, size: 16, color: { argb: 'FF2c5282' } };
      titleRow.alignment = { horizontal: 'center' };
      worksheet.mergeCells('A1:C1');

      const subtitleRow = worksheet.addRow([
        `Generado: ${new Date().toLocaleDateString('es-ES')} | Total: ${this.filteredCategories.length} categorías`
      ]);
      subtitleRow.font = { italic: true, color: { argb: 'FF666666' } };
      subtitleRow.alignment = { horizontal: 'center' };
      worksheet.mergeCells('A2:C2');
      worksheet.addRow([]);

      const headerRow = worksheet.addRow(['Nombre', 'Descripción', 'Usuario']);
      const headerRowNumber = 4;
      headerRow.eachCell(cell => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF2c5282' }
        };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.border = {
          top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' }
        };
      });

      this.filteredCategories.forEach((cat, index) => {
        const row = worksheet.addRow([cat.name, cat.description || '', cat.user_id || '']);
        row.eachCell(cell => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: index % 2 === 0 ? 'FFFFFFFF' : 'FFe6f7ff' }
          };
          cell.border = {
            left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' }
          };
        });
      });

      worksheet.autoFilter = {
        from: { row: headerRowNumber, column: 1 },
        to: { row: headerRowNumber, column: 3 }
      };

      worksheet.views = [{
        state: 'frozen',
        ySplit: headerRowNumber,
        activeCell: `A${headerRowNumber + 1}`
      }];

      worksheet.columns = [
        { key: 'name', width: 20 },
        { key: 'description', width: 30 },
        { key: 'user_id', width: 15 }
      ];

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `categorias_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      this.showExportMenu = false;
    } catch (error) {
      alert('❌ Error exportando Excel');
    }
  }

  async exportPDF() {
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const tableHtml = `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2 style="color: #2c5282; margin-bottom: 5px;">Reporte de Categorías</h2>
          <p style="color: #666; margin: 2px 0;">Generado: ${new Date().toLocaleDateString('es-ES')}</p>
          <p style="color: #666; margin: 2px 0;">Total: ${this.filteredCategories.length} categorías</p>
          <table style="width:100%; border-collapse: collapse; margin-top: 15px;">
            <thead>
              <tr style="background-color: #2c5282; color: white;">
                <th style="padding: 8px; border: 1px solid #2c5282; text-align: left;">Nombre</th>
                <th style="padding: 8px; border: 1px solid #2c5282; text-align: left;">Descripción</th>
                <th style="padding: 8px; border: 1px solid #2c5282; text-align: left;">Usuario</th>
              </tr>
            </thead>
            <tbody>
              ${this.filteredCategories.map((cat, index) => `
                <tr style="background-color: ${index % 2 === 0 ? '#f7fafc' : '#e6f7ff'};">
                  <td style="padding: 6px; border: 1px solid #ddd; color: #333;">${cat.name}</td>
                  <td style="padding: 6px; border: 1px solid #ddd; color: #333;">${cat.description || ''}</td>
                  <td style="padding: 6px; border: 1px solid #ddd; color: #333;">${cat.user_id || ''}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
      html2pdf()
        .from(tableHtml)
        .set({
          margin: 10,
          filename: `categorias_${new Date().toISOString().slice(0, 10)}.pdf`,
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
        })
        .save();
      this.showExportMenu = false;
    } catch (error) {
      alert('❌ Error exportando PDF');
    }
  }

  async exportEmail() {
    try {
      const csvData = this.generateCSVFromData(this.filteredCategories);
      const summaryData = this.filteredCategories.map(cat => ({
        name: cat.name,
        description: cat.description || '',
        user_id: cat.user_id || ''
      }));
      await this.categoryService.exportEmail({
        csv_data: csvData,
        total_categories: this.filteredCategories.length,
        summary_data: summaryData
      }).toPromise();
      alert(`📧 Email enviado con ${this.filteredCategories.length} categorías`);
      this.showExportMenu = false;
    } catch (error) {
      alert('❌ Error enviando email');
    }
  }

  toggleExportMenu() {
    this.showExportMenu = !this.showExportMenu;
  }
}