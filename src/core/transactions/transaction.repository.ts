import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infra/db/prisma/prisma.service';
import {
  CreateTransactionDto,
  OrderEnum,
  PageListTransactionDto,
  TransactionDto,
  TransactionOrderByEnum,
} from './transaction.dto';
import { AppErrorInternalServerError } from 'src/support/errors/app.error';

@Injectable()
export class TransactionRepository {
  constructor(private prisma: PrismaService) {}
  private readonly logger = new Logger(TransactionRepository.name);

  async create(transaction: CreateTransactionDto): Promise<TransactionDto> {
    try {
      return await this.prisma.transaction.create({
        data: transaction,
      });
    } catch (error) {
      this.logger.debug(`Error on create transaction: ${error.message}`);
      throw new AppErrorInternalServerError('Error on create transaction');
    }
  }

  async getById(id: number): Promise<TransactionDto | null> {
    try {
      const transaction = await this.prisma.transaction.findUnique({
        where: {
          id,
        },
      });
      return transaction;
    } catch (error) {
      this.logger.debug(`Error on get transaction by id: ${error.message}`);
      return null;
    }
  }

  async getLastByAccountId(accountId: string): Promise<TransactionDto | null> {
    return this.prisma.transaction.findFirst({
      where: {
        accountId,
      },
      orderBy: {
        id: 'desc',
      },
    });
  }

  async getAllByAccountId(accountId: string): Promise<TransactionDto[]> {
    return this.prisma.transaction.findMany({
      where: {
        accountId,
      },
    });
  }

  async getAll({
    page,
    take,
    ...orderParams
  }: PageListTransactionDto): Promise<TransactionDto[]> {
    const skip = page && take ? (page - 1) * take : undefined;
    const orderBy = orderParams.orderBy || TransactionOrderByEnum.ID;
    const order = orderParams.order || OrderEnum.DESC;

    return this.prisma.transaction.findMany({
      take: take ? take : undefined,
      skip,
      orderBy: {
        [orderBy]: order,
      },
    });
  }

  async getBalance(accountId: string): Promise<number> {
    const balance = await this.prisma.transaction.aggregate({
      where: {
        accountId,
      },
      _sum: {
        amount: true,
      },
    });
    return balance._sum.amount || 0;
  }
}
