// src/app/core/services/stats.service.ts
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { StatsByUser, StatsByCategory, StatsOverTime } from '../models/stats.models';
import { environment } from '../../app.config';

@Injectable({ providedIn: 'root' })
export class StatsService {
  private baseUrl = environment.apiUrl + '/stats';

  constructor(private http: HttpClient) {}

  getByUser(): Observable<StatsByUser[]> {
    return this.http.get<StatsByUser[]>(`${this.baseUrl}/by-user`);
  }

  getByCategory(): Observable<StatsByCategory[]> {
    return this.http.get<StatsByCategory[]>(`${this.baseUrl}/by-category`);
  }

  getOverTime(): Observable<StatsOverTime[]> {
    return this.http.get<StatsOverTime[]>(`${this.baseUrl}/over-time`);
  }
}
