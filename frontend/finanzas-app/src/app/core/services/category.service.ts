// frontend/finanzas-app/src/app/core/services/category.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Category } from '../models/category.model';
import { environment } from '../../app.config';

@Injectable()
export class CategoryService {
  private baseUrl = `${environment.apiUrl}/categories/`;

  constructor(private http: HttpClient) { }

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(this.baseUrl);
  }

  getCategory(id: string): Observable<Category> {
    return this.http.get<Category>(`${this.baseUrl}${id}`);
  }

  createCategory(category: Partial<Category>): Observable<Category> {
    return this.http.post<Category>(this.baseUrl, category);
  }

  deleteCategory(id: string): Observable<{ status: string }> {
    return this.http.delete<{ status: string }>(`${this.baseUrl}${id}`);
  }

  updateCategory(id: string, category: Partial<Category>): Observable<Category> {
    return this.http.put<Category>(`${this.baseUrl}${id}`, category);
  }

  getCategoriesFiltered(filters?: {
    name?: string,
    description?: string
  }): Observable<Category[]> {
    let params = new HttpParams();
    if (filters) {
      if (filters.name) params = params.set('name', filters.name);
      if (filters.description) params = params.set('description', filters.description);
    }
    return this.http.get<Category[]>(this.baseUrl, { params });
  }

  exportCSV(filters?: any): Observable<Blob> {
    let params = new HttpParams();
    if (filters) {
      if (filters.name) params = params.set('name', filters.name);
      if (filters.description) params = params.set('description', filters.description);
    }
    return this.http.get(`${this.baseUrl}export/csv`, {
      params,
      responseType: 'blob'
    });
  }

  exportEmail(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}export/email`, data);
  }
}