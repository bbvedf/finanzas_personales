export interface Transaction {
  id: string;
  user_id: number;
  category_id: string;
  username: string;
  category_name: string;
  amount: number;
  description?: string;
  date: Date;  
}
