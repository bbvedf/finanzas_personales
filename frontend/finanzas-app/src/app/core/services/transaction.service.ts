// frontend/finanzas-app/src/app/core/services/transaction.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Transaction } from '../models/transaction.model';
import { environment } from '../../app.config';

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private baseUrl = `${environment.apiUrl}/transactions`;

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
    user_id?: string,
    category_id?: string,
    start_date?: string,
    end_date?: string
  }): Observable<Transaction[]> {
    let params = new URLSearchParams();
    if (filters) {
      if (filters.user_id) params.set('user_id', filters.user_id);
      if (filters.category_id) params.set('category_id', filters.category_id);
      if (filters.start_date) params.set('start_date', filters.start_date);
      if (filters.end_date) params.set('end_date', filters.end_date);
    }
    const queryString = params.toString();
    const url = queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl;
    return this.http.get<Transaction[]>(url);
  }

}
