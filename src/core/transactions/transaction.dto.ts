import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class TransactionDto {
  @ApiProperty({
    description: 'Transaction ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Account ID',
    example: 'acc-1',
  })
  accountId: string;

  @ApiProperty({
    description: 'Transaction amount, in cents',
    example: 100,
  })
  amount: number;

  @ApiProperty({
    description: 'Transaction creation date',
    example: '2023-01-01T00:00:00.000Z',
  })
  createdAt: Date;
}

export class CreateTransactionDto {
  @ApiProperty({
    description: 'Account ID',
    example: 'acc-1',
  })
  @IsNotEmpty()
  @IsString()
  accountId: string;

  @ApiProperty({
    description: 'Transaction amount, in cents',
    example: 100,
  })
  @IsNotEmpty()
  @IsInt()
  amount: number;
}

export enum TransactionOrderByEnum {
  ID = 'id',
  AMOUNT = 'amount',
  ACCOUNT_ID = 'accountId',
  CREATED_AT = 'createdAt',
}

export enum OrderEnum {
  ASC = 'asc',
  DESC = 'desc',
}

export class PageListTransactionDto {
  @ApiProperty({
    description: 'Items per page',
    default: 10,
    required: false,
  })
  @IsOptional()
  @IsInt()
  take: number;

  @ApiProperty({
    description: 'Page number',
    default: 1,
    required: false,
  })
  @IsOptional()
  @IsInt()
  page: number;

  @ApiProperty({
    description: 'Order by',
    enum: TransactionOrderByEnum,
    default: TransactionOrderByEnum.CREATED_AT,
    required: false,
  })
  @IsOptional()
  @IsEnum(TransactionOrderByEnum)
  orderBy: TransactionOrderByEnum;

  @ApiProperty({
    description: 'Order direction',
    enum: OrderEnum,
    default: OrderEnum.DESC,
    required: false,
  })
  @IsOptional()
  @IsEnum(OrderEnum)
  order: OrderEnum;
}
