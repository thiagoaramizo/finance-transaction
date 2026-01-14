import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppService } from './app.service';
import { LoggerModule } from 'nestjs-pino';
import { AppLogger } from './support/app.logger';
import { PrismaModule } from './infra/db/prisma/prisma.module';
import { TransactionsModule } from './core/transactions/transactions.module';

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
  ],
  providers: [AppService, AppLogger],
  exports: [AppLogger],
})
export class AppModule {}
