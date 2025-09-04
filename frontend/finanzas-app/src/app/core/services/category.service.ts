//frontend/finanzas-app/src/app/core/services/category.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Category } from '../models/category.model';
import { environment } from '../../app.config';

@Injectable()
export class CategoryService {
  private baseUrl = `${environment.apiUrl}/categories/`; // ← Barra final añadida

  constructor(private http: HttpClient) {}

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(this.baseUrl); // GET /categories/
  }

  getCategory(id: string): Observable<Category> {
    return this.http.get<Category>(`${this.baseUrl}${id}`); // GET /categories/{id}
  }

  createCategory(category: Partial<Category>): Observable<Category> {
    return this.http.post<Category>(this.baseUrl, category); // POST /categories/
  }

  deleteCategory(id: string): Observable<{ status: string }> {
    return this.http.delete<{ status: string }>(`${this.baseUrl}${id}`); // DELETE /categories/{id}
  }  

  updateCategory(id: string, category: Partial<Category>): Observable<Category> {
    return this.http.put<Category>(`${this.baseUrl}${id}`, category); // PUT /categories/{id}
  }  
}