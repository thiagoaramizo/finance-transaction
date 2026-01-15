import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppService } from './app.service';
import { LoggerModule } from 'nestjs-pino';
import { AppLogger } from './support/app.logger';
import { PrismaModule } from './infra/db/prisma/prisma.module';
import { TransactionsModule } from './core/transactions/transactions.module';
import { BullModule } from '@nestjs/bullmq';
import { QueueModule } from './infra/queue/queue.module';

@Module({
  imports: [
    // Core
    TransactionsModule,

    // Global modules
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: 'trace',
      },
    }),
    PrismaModule,
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const redisUrl = config.get('REDIS_URL', 'redis://localhost:6379');
        const url = new URL(redisUrl as string);
        return {
          connection: {
            host: url.hostname,
            port: Number(url.port),
          },
        };
      },
    }),
    QueueModule,
  ],
  providers: [AppService, AppLogger],
  exports: [AppLogger],
})
export class AppModule {}
