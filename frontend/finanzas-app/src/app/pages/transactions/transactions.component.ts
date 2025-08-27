import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TransactionService } from '../../core/services/transaction.service';
import { Transaction } from '../../core/models/transaction.model';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './transactions.component.html',
})
export class TransactionsComponent implements OnInit {
  transactions: Transaction[] = [];
  userId = '';
  categoryId = '';
  amount: number | null = null;
  description = '';

  constructor(private transactionService: TransactionService) {}

  ngOnInit(): void {
    this.loadTransactions();
  }

  loadTransactions() {
    this.transactionService.getTransactions().subscribe(data => this.transactions = data);
  }

  addTransaction() {
    if (!this.userId || !this.categoryId || this.amount === null) return;
    this.transactionService.createTransaction({
      user_id: this.userId,
      category_id: this.categoryId,
      amount: this.amount,
      description: this.description
    }).subscribe(() => {
      this.userId = '';
      this.categoryId = '';
      this.amount = null;
      this.description = '';
      this.loadTransactions();
    });
  }

  deleteTransaction(id: string) {
    this.transactionService.deleteTransaction(id).subscribe(() => this.loadTransactions());
  }
}
