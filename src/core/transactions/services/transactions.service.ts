import { Injectable, Logger } from '@nestjs/common';
import { TransactionRepository } from '../repositories/transaction.repository';
import {
  CreateTransactionDto,
  PageListTransactionDto,
  TransactionDto,
} from '../dto/transaction.dto';
import { ConfigService } from '@nestjs/config';
import { QueueService } from 'src/infra/queue/queue.service';
import { v7 as uuidv7 } from 'uuid';
import {
  AppErrorConflict,
  AppErrorInternalServerError,
} from 'src/support/errors/app.error';
import { TransactionErrorEnum } from '../errors/transaction.errors';

@Injectable()
export class TransactionsService {
  private IDEMPOTENCY_SECONDS: number;
  private readonly logger = new Logger(TransactionsService.name);

  constructor(
    private readonly transactionRepository: TransactionRepository,
    private readonly configService: ConfigService,
    private readonly queueService: QueueService,
  ) {
    this.IDEMPOTENCY_SECONDS =
      this.configService.get('IDEMPOTENCY_SECONDS') || 30;
  }

  async create(transaction: CreateTransactionDto): Promise<TransactionDto> {
    try {
      const createdAt = new Date();
      const id = uuidv7();
      return await this.queueService.addAndAwaitCompletion<TransactionDto>(id, {
        ...transaction,
        createdAt,
        id,
      });
    } catch (error) {
      if (!error.message || typeof error.message !== 'string') {
        throw new AppErrorInternalServerError('Internal server error');
      }
      switch (error.message) {
        case TransactionErrorEnum.INSUFFICIENT_FUNDS:
        case TransactionErrorEnum.IDEMPOTENCY_ERROR:
          throw new AppErrorConflict(error.message as string);
        default:
          throw new AppErrorInternalServerError('Internal server error');
      }
    }
  }

  async getAll(params: PageListTransactionDto): Promise<TransactionDto[]> {
    return this.transactionRepository.getAll(params);
  }
}
