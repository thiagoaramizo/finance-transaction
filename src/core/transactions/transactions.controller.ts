import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import {
  CreateTransactionDto,
  PageListTransactionDto,
  TransactionDto,
} from './transaction.dto';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  create(
    @Body() createTransactionDto: CreateTransactionDto,
  ): Promise<TransactionDto> {
    return this.transactionsService.create(createTransactionDto);
  }

  @Get()
  getAll(@Query() params: PageListTransactionDto): Promise<TransactionDto[]> {
    return this.transactionsService.getAll(params);
  }
}
