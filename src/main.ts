import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('/api');

  app.useGlobalPipes(new ValidationPipe(
    {
      whitelist: true, // remove non-whitelisted properties
      forbidNonWhitelisted: true // throw an error if non-whitelisted properties are present
    }
  ));

  await app.listen(3000);
}
bootstrap();
