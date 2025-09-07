// frontend/finanzas-app/src/app/core/services/transaction.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Transaction } from '../models/transaction.model';
import { environment } from '../../app.config';

@Injectable()
export class TransactionService {
  private baseUrl = `${environment.apiUrl}/transactions/`;

  constructor(private http: HttpClient) { }

  getTransactions(): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(this.baseUrl);
  }

  getTransaction(id: string): Observable<Transaction> {
    return this.http.get<Transaction>(`${this.baseUrl}/${id}`);
  }

  createTransaction(transaction: Partial<Transaction>): Observable<Transaction> {
    return this.http.post<Transaction>(this.baseUrl, transaction);
  }

  updateTransaction(id: string, transaction: Partial<Transaction>): Observable<Transaction> {
    return this.http.put<Transaction>(`${this.baseUrl}/${id}`, transaction);
  }

  deleteTransaction(id: string): Observable<{ status: string }> {
    return this.http.delete<{ status: string }>(`${this.baseUrl}/${id}`);
  }

  getTransactionsFiltered(filters?: {
    user_id?: number,
    category_id?: string,
    start_date?: string,
    end_date?: string
  }): Observable<Transaction[]> {
    let params = new HttpParams();  // Usar HttpParams en lugar de URLSearchParams

    if (filters) {
      if (filters.user_id !== undefined) params = params.set('user_id', filters.user_id.toString());
      if (filters.category_id) params = params.set('category_id', filters.category_id);
      if (filters.start_date) params = params.set('start_date', filters.start_date);
      if (filters.end_date) params = params.set('end_date', filters.end_date);
    }

    return this.http.get<Transaction[]>(this.baseUrl, { params });
  }

  exportCSV(filters?: any): Observable<Blob> {
    let params = new HttpParams();

    if (filters) {
      if (filters.user_id) params = params.set('user_id', filters.user_id);
      if (filters.category_id) params = params.set('category_id', filters.category_id);
      if (filters.start_date) params = params.set('start_date', filters.start_date);
      if (filters.end_date) params = params.set('end_date', filters.end_date);
    }

    return this.http.get(`${this.baseUrl}export/csv`, {
      params: params,
      responseType: 'blob'
    });
  }

  exportEmail(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}export/email`, data);  // ← Enviar el objeto completo
  }

}

