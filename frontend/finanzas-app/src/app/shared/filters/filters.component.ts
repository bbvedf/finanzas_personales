import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filters.component.html',
  styleUrls: ['./filters.component.scss']
})
export class FiltersComponent {
  @Input() columns: { key: string; label: string; filterType?: 'text' | 'number' | 'date' }[] = [];
  @Input() filters: any = {};
  @Input() activeFilter: string | null = null;
  @Output() filtersChange = new EventEmitter<any>();
  @Output() toggleFilter = new EventEmitter<string>();
  @Output() sortChange = new EventEmitter<{ column: string; direction: 'asc' | 'desc' | null }>();

  tempFilters: any = {};

  ngOnInit() {
    // Inicializar tempFilters desde filters
    this.columns.forEach(col => {
      if (!this.filters[col.key]) {
        this.filters[col.key] = col.filterType === 'number'
          ? { min: null, max: null, sortDirection: null }
          : col.filterType === 'date'
            ? { start: null, end: null, sortDirection: null }
            : { value: '', mode: 'contains', matchMode: 'all', sortDirection: null };
      }
      this.tempFilters[col.key] = { ...this.filters[col.key] };
    });
  }

  openFilter(colKey: string) {
    this.toggleFilter.emit(colKey);
  }

  toggleSort(colKey: string) {
    const current = this.filters[colKey]?.sortDirection;
    let newDirection: 'asc' | 'desc' | null = null;

    if (current === null || current === undefined) newDirection = 'asc';
    else if (current === 'asc') newDirection = 'desc';
    else if (current === 'desc') newDirection = 'asc';

    this.filters[colKey].sortDirection = newDirection;
    this.sortChange.emit({ column: colKey, direction: newDirection });
  }

  applyFilter() {
    Object.keys(this.tempFilters).forEach(key => {
      this.filters[key] = { ...this.tempFilters[key] };
    });
    this.filtersChange.emit(this.filters);
    this.toggleFilter.emit(undefined); // Cierra el filtro
  }

  cancelFilter() {
    Object.keys(this.filters).forEach(key => {
      this.tempFilters[key] = { ...this.filters[key] };
    });
    this.toggleFilter.emit(undefined); // Cierra el filtro
  }
}