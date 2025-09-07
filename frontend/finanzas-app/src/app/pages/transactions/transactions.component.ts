import { Component, OnInit } from '@angular/core';
import { HostListener, ElementRef } from '@angular/core';
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
        private http: HttpClient,
        private elementRef: ElementRef,
    ) { }

    // Añadir propiedad para controlar el menú
    showExportMenu = false;

    // Método para cerrar menú al hacer click fuera
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
        return rect.right + 150 > window.innerWidth; // 150 = ancho del menú
    }


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

    //EXPORTs    
    exportCSV() {
        // Usar filteredTransactions en lugar de llamar al backend
        const csvData = this.generateCSVFromData(this.filteredTransactions);

        const blob = new Blob([csvData], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transacciones_filtradas_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.showExportMenu = false;
    }

    private generateCSVFromData(transactions: Transaction[]): string {
        let csvData = "Usuario,Categoría,Monto,Fecha,Descripción\n";

        for (const tx of transactions) {
            csvData += `"${tx.username}","${tx.category_name}",${tx.amount},${tx.date},"${tx.description || ''}"\n`;
        }

        return csvData;
    }

    async exportExcel() {
        const ExcelJS = (await import('exceljs')).default;
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Transacciones');

        // Título
        const titleRow = worksheet.addRow(['Reporte de Transacciones Finanzas']);
        titleRow.font = { bold: true, size: 16, color: { argb: 'FF2c5282' } };
        titleRow.alignment = { horizontal: 'center' };
        worksheet.mergeCells('A1:E1');

        // Subtítulo
        const subtitleRow = worksheet.addRow([
            `Generado: ${new Date().toLocaleDateString('es-ES')} | Total: ${this.filteredTransactions.length} transacciones`
        ]);
        subtitleRow.font = { italic: true, color: { argb: 'FF666666' } };
        subtitleRow.alignment = { horizontal: 'center' };
        worksheet.mergeCells('A2:E2');
        worksheet.addRow([]); // Fila vacía

        // Cabecera de tabla (fila 4)
        const headerRow = worksheet.addRow(['Usuario', 'Categoría', 'Monto', 'Fecha', 'Descripción']);
        const headerRowNumber = 4; // ← Definir aquí

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

        // Datos con filas alternas
        this.filteredTransactions.forEach((tx, index) => {
            const row = worksheet.addRow([
                tx.username,
                tx.category_name,
                tx.amount, // ← Sin formula, directamente el valor
                new Date(tx.date), // ← Sin formula, directamente la fecha
                tx.description || ''
            ]);

            // Filas alternas azul/blanco
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

        // AUTO-FILTROS (solución nativa)
        worksheet.autoFilter = {
            from: { row: headerRowNumber, column: 1 }, // Fila 4, col A (1-based)
            to: { row: headerRowNumber, column: 5 }    // Fila 4, col E (1-based)
        };

        // INMOVILIZAR PANELES
        const dataStartRow = headerRowNumber + 1;
        worksheet.views = [{
            state: 'frozen',
            ySplit: headerRowNumber, // Congelar hasta la cabecera (fila 4)
            activeCell: `A${dataStartRow}` // Celda activa inicio datos
        }];

        // AUTO-AJUSTAR COLUMNAS
        worksheet.columns = [
            { key: 'username', width: 20 },
            { key: 'category', width: 15 },
            { key: 'amount', width: 12, style: { numFmt: '#,##0.00' } },
            { key: 'date', width: 12, style: { numFmt: 'dd/mm/yyyy' } },
            { key: 'description', width: 30 }
        ];

        // Generar y descargar
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transacciones_${new Date().toISOString().slice(0, 10)}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);

        this.showExportMenu = false;
    }

    async exportPDF() {
        // Cargar html2pdf solo cuando se necesite
        const html2pdf = (await import('html2pdf.js')).default;

        const tableHtml = `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h2 style="color: #2c5282; margin-bottom: 5px;">Reporte de Transacciones Finanzas</h2>
      <p style="color: #666; margin: 2px 0;">Generado: ${new Date().toLocaleDateString('es-ES')}</p>
      <p style="color: #666; margin: 2px 0;">Total: ${this.filteredTransactions.length} transacciones</p>
      
      <table style="width:100%; border-collapse: collapse; margin-top: 15px;">
        <thead>
          <tr style="background-color: #2c5282; color: white;">
            <th style="padding: 8px; border: 1px solid #2c5282; text-align: left;">Usuario</th>
            <th style="padding: 8px; border: 1px solid #2c5282; text-align: left;">Categoría</th>
            <th style="padding: 8px; border: 1px solid #2c5282; text-align: right;">Monto</th>
            <th style="padding: 8px; border: 1px solid #2c5282; text-align: center;">Fecha</th>
            <th style="padding: 8px; border: 1px solid #2c5282; text-align: left;">Descripción</th>
          </tr>
        </thead>
        <tbody>
          ${this.filteredTransactions.map((tx, index) => `
            <tr style="background-color: ${index % 2 === 0 ? '#f7fafc' : '#e6f7ff'};">
              <td style="padding: 6px; border: 1px solid #ddd; color: #333;">${tx.username}</td>
              <td style="padding: 6px; border: 1px solid #ddd; color: #333;">${tx.category_name}</td>
              <td style="padding: 6px; border: 1px solid #ddd; color: #333; text-align: right;">${tx.amount.toFixed(2)} €</td>
              <td style="padding: 6px; border: 1px solid #ddd; color: #333; text-align: center;">${new Date(tx.date).toLocaleDateString('es-ES')}</td>
              <td style="padding: 6px; border: 1px solid #ddd; color: #333;">${(tx.description || '').substring(0, 30)}${(tx.description || '').length > 30 ? '...' : ''}</td>
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
                filename: `transacciones_${new Date().toISOString().slice(0, 10)}.pdf`,
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' } // ← horizontal para más espacio
            })
            .save();

        this.showExportMenu = false;
    }

    async exportEmail() {
        try {
            const csvData = this.generateCSVFromData(this.filteredTransactions);

            // Preparar datos para el resumen
            const summaryData = this.filteredTransactions.map(tx => ({
                username: tx.username,
                category_name: tx.category_name,
                cantidad: tx.amount,
                description: tx.description,
                fecha: tx.date                
            }));

            await this.transactionService.exportEmail({
                csv_data: csvData,
                total_transactions: this.filteredTransactions.length,
                summary_data: summaryData  // ← Enviar datos para resumen
            }).toPromise();

            alert(`📧 Email enviado con ${this.filteredTransactions.length} transacciones filtradas`);
            this.showExportMenu = false;
        } catch (error) {
            alert('❌ Error enviando email');
        }
    }

}

