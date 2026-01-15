import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { TransactionsService } from '../services/transactions.service';
import {
  CreateTransactionDto,
  PageListTransactionDto,
  TransactionDto,
} from '../dto/transaction.dto';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Transaction')
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @ApiOperation({
    summary: 'Create a new transaction',
  })
  @ApiCreatedResponse({
    description: 'Transaction created',
    type: TransactionDto,
  })
  @Post()
  create(
    @Body() createTransactionDto: CreateTransactionDto,
  ): Promise<TransactionDto> {
    return this.transactionsService.create(createTransactionDto);
  }

  @ApiOperation({
    summary: 'Get all transactions',
  })
  @ApiOkResponse({
    description: 'List of transactions',
    type: TransactionDto,
    isArray: true,
  })
  @Get()
  getAll(@Query() params: PageListTransactionDto): Promise<TransactionDto[]> {
    return this.transactionsService.getAll(params);
  }
}
