import { Injectable } from '@nestjs/common';
import { TransactionRepository } from './transaction.repository';
import { CreateTransactionDto, TransactionDto } from './transaction.dto';
import { ConfigService } from '@nestjs/config';
import { AppErrorConflict } from '../../support/errors/app.error';

@Injectable()
export class TransactionsService {
  private IDEMPOTENCY_SECONDS: number;

  constructor(
    private transactionRepository: TransactionRepository,
    private configService: ConfigService,
  ) {
    this.IDEMPOTENCY_SECONDS =
      this.configService.get('IDEMPOTENCY_SECONDS') || 30;
  }

  private checkIdempotency(
    lastTransaction: TransactionDto,
    transaction: CreateTransactionDto,
  ) {
    if (
      lastTransaction.amount === transaction.amount &&
      lastTransaction.createdAt >
        new Date(Date.now() - this.IDEMPOTENCY_SECONDS * 1000)
    ) {
      throw new AppErrorConflict('Transaction already exists');
    }
  }

  async create(transaction: CreateTransactionDto): Promise<TransactionDto> {
    const [balance, lastTransaction] = await Promise.all([
      this.transactionRepository.getBalance(transaction.accountId),
      this.transactionRepository.getLastByAccountId(transaction.accountId),
    ]);

    if (balance + transaction.amount < 0) {
      throw new AppErrorConflict('Insufficient balance');
    }

    // Garantindo uma idempotência
    if (lastTransaction) {
      this.checkIdempotency(lastTransaction, transaction);
    }

    return this.transactionRepository.create(transaction);
  }
}
