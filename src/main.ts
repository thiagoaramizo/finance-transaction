import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppLogger } from './support/app.logger';
import { ValidationPipe } from '@nestjs/common';
import { AppErrorHandler } from './support/errors/app.error-handler';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Pino logger
  app.useLogger(app.get(AppLogger));

  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Validation and transform pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global error handler
  app.useGlobalFilters(new AppErrorHandler());

  //Documentation
  const config = new DocumentBuilder()
    .setTitle('Finance Transaction API')
    .setVersion('1.0')
    .addTag('Transaction')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, documentFactory);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
}
void bootstrap();
