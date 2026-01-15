import { Module } from '@nestjs/common';
import { TransactionsService } from './services/transactions.service';
import { TransactionsController } from './controllers/transactions.controller';
import { TransactionRepository } from './repositories/transaction.repository';
import { CreateTransactionService } from './services/create-transaction.service';

@Module({
  controllers: [TransactionsController],
  providers: [
    TransactionsService,
    CreateTransactionService,
    TransactionRepository,
  ],
  exports: [CreateTransactionService],
})
export class TransactionsModule {}
