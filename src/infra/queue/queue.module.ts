import { BullModule } from '@nestjs/bullmq';
import { Global, Module } from '@nestjs/common';
import { QueueService } from './queue.service';
import { QUEUE_NAME } from './queue.name';
import { TransactionsModule } from 'src/core/transactions/transactions.module';
import { QueueProcessor } from './queue.processor';

@Global()
@Module({
  imports: [
    BullModule.registerQueue({
      name: QUEUE_NAME,
    }),
    TransactionsModule,
  ],
  providers: [QueueService, QueueProcessor],
  exports: [QueueService],
})
export class QueueModule {}
