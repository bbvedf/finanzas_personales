export interface Transaction {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  description?: string;
  date: string | null;
}
