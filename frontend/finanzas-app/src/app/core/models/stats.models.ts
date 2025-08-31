// src/app/core/models/stats.models.ts
export interface StatsByCategory {
  category_id: string;
  category_name: string;
  total: number;
}

export interface StatsByUser {
  user_id: string;
  username: string;
  total: number;
}

export interface StatsOverTime {
  month: string; // "YYYY-MM"
  total: number;
}
