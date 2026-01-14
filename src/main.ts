import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppLogger } from './support/app.logger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useLogger(app.get(AppLogger));
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
