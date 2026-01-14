import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/infra/db/prisma/prisma.service';
import { CreateTransactionDto, TransactionDto } from './transaction.dto';

@Injectable()
export class TransactionRepository {
  constructor(private prisma: PrismaService) {}

  async create(transaction: CreateTransactionDto): Promise<TransactionDto> {
    return this.prisma.transaction.create({
      data: transaction,
    });
  }

  async getById(id: number): Promise<TransactionDto | null> {
    return this.prisma.transaction.findUnique({
      where: {
        id,
      },
    });
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

  async getAll(): Promise<TransactionDto[]> {
    return this.prisma.transaction.findMany();
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
