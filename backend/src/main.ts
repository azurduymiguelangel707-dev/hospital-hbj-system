import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Servir archivos estáticos desde /uploads
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log('');
  console.log('    🏥 Hospital Management System API');
  console.log(`    🚀 Server: http://localhost:${port}`);
  console.log(`    📚 Docs: http://localhost:${port}/api/docs`);
  console.log(`    📁 Uploads: http://localhost:${port}/uploads`);
  console.log('');
}
bootstrap();