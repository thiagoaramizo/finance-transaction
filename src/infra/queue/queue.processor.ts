import { Processor, WorkerHost } from '@nestjs/bullmq';
import { QUEUE_NAME } from './queue.name';
import { CreateTransactionService } from 'src/core/transactions/services/create-transaction.service';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { TransactionDto } from 'src/core/transactions/dto/transaction.dto';

@Processor(QUEUE_NAME)
export class QueueProcessor extends WorkerHost {
  private readonly logger = new Logger(QueueProcessor.name);
  constructor(
    private readonly createTransactionService: CreateTransactionService,
  ) {
    super();
  }

  async process(job: Job<TransactionDto>): Promise<TransactionDto> {
    this.logger.debug(`Process transaction ${job.data.id} on ${QUEUE_NAME}`);
    try {
      const result = await this.createTransactionService.execute(job.data);
      this.logger.debug(
        `Transaction ${job.data.id} processed successfully: ${JSON.stringify(
          result,
        )}`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Error processing transaction ${job.data.id}: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
