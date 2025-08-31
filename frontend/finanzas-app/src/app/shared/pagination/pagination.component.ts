// frontend/finanzas-app/src/app/shared/pagination/pagination.component.ts
import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-pagination',
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.scss'],
  imports: [CommonModule, FormsModule],
  standalone: true
})
export class PaginationComponent implements OnChanges {
  @Input() totalItems: number = 0;
  @Input() pageSize: number = 10;
  @Input() currentPage: number = 1;

  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  manualPageSize: number | null = null;
  manualPage: number | null = null;

  calculatedTotalPages: number = 1;

  ngOnChanges() {
    this.updateTotalPages();
  }

  updateTotalPages() {
    this.calculatedTotalPages = Math.max(1, Math.ceil(this.totalItems / this.pageSize));
    if (this.currentPage > this.calculatedTotalPages) {
      this.currentPage = this.calculatedTotalPages;
      this.pageChange.emit(this.currentPage);
    }
  }

  changePageSize(size: number) {
    this.pageSize = size;
    this.currentPage = 1; // 👈 reseteamos a la primera página
    this.pageSizeChange.emit(this.pageSize);
    this.pageChange.emit(this.currentPage); // 👈 avisamos también del cambio de página
    this.updateTotalPages();
  }

  applyManualPageSize() {
    if (this.manualPageSize && this.manualPageSize > 0) {
      this.changePageSize(this.manualPageSize);
      this.manualPageSize = null;
    }
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.calculatedTotalPages) {
      this.currentPage = page;
      this.pageChange.emit(this.currentPage);
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.pageChange.emit(this.currentPage);
    }
  }

  nextPage() {
    if (this.currentPage < this.calculatedTotalPages) {
      this.currentPage++;
      this.pageChange.emit(this.currentPage);
    }
  }

  applyManualPage() {
    if (this.manualPage && this.manualPage >= 1 && this.manualPage <= this.calculatedTotalPages) {
      this.goToPage(this.manualPage);
      this.manualPage = null;
    }
  }
}
