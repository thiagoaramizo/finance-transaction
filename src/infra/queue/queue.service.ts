import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue, QueueEvents } from 'bullmq';
import { AppErrorInternalServerError } from 'src/support/errors/app.error';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);
  private readonly queueEvents: QueueEvents;

  constructor(
    @InjectQueue('transactionQueue') private readonly queue: Queue,
    private readonly configService: ConfigService,
  ) {
    const redisUrl =
      this.configService.get('REDIS_URL') ?? 'redis://localhost:6379';
    const url = new URL(redisUrl as string);

    this.queueEvents = new QueueEvents('transactionQueue', {
      connection: {
        host: url.hostname,
        port: Number(url.port),
      },
    });
  }

  async add<T>(id: string, data: T): Promise<string | undefined> {
    const job = await this.queue.add(id, data);
    if (!job) {
      throw new AppErrorInternalServerError(`Could not add job ${id} to queue`);
    }
    this.logger.verbose(`Job ${id} added to queue with ID ${job.id}`);
    return job.id;
  }

  async addAndAwaitCompletion<T>(
    id: string,
    data: T,
    timeoutMs: number = 30000,
  ): Promise<T> {
    const job = await this.queue.add(id, data);
    if (!job) {
      throw new AppErrorInternalServerError(`Could not add job ${id} to queue`);
    }
    const result: unknown = await job.waitUntilFinished(
      this.queueEvents,
      timeoutMs,
    );
    return result as T;
  }
}
