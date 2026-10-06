import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import * as cookieParser from 'cookie-parser';
import { validateApiEnvironment } from './config/env';

async function bootstrap() {
  const env = validateApiEnvironment();
  const { AppModule } = await import('./app/app.module');
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  app.enableCors({
    origin: env.FRONTEND_URL,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  });

  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new GlobalExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('Devlist API')
    .setDescription(
      'API for Devlist, a community-driven developer tools catalog with GitHub authentication, favorites, suggestions, and catalog administration.',
    )
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(env.PORT);
}
bootstrap();
