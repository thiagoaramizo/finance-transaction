import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppLogger } from './support/app.logger';
import { ValidationPipe } from '@nestjs/common';
import { AppErrorHandler } from './support/errors/app.error-handler';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useLogger(app.get(AppLogger));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );
  app.useGlobalFilters(new AppErrorHandler());
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
