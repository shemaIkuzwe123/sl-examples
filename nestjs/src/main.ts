import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import morgan from 'morgan';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // HTTP request logs: compact in dev, Apache-style in production.
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  // Validate and transform every incoming payload against its DTO.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip properties not on the DTO
      forbidNonWhitelisted: true, // reject instead of stripping
      transform: true, // plain JSON -> DTO class instances
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
