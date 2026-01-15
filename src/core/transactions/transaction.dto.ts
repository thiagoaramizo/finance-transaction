import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class TransactionDto {
  id: number;
  accountId: string;
  amount: number;
  createdAt: Date;
}

export class CreateTransactionDto {
  @IsNotEmpty()
  @IsString()
  accountId: string;

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
  @IsOptional()
  @IsInt()
  take: number;

  @IsOptional()
  @IsInt()
  page: number;

  @IsOptional()
  @IsEnum(TransactionOrderByEnum)
  orderBy: TransactionOrderByEnum;

  @IsOptional()
  @IsEnum(OrderEnum)
  order: OrderEnum;
}
