import { IsInt, IsNotEmpty, IsString } from 'class-validator';

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
