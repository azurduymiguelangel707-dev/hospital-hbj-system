# Script para arreglar encoding UTF-8 en el backend
# Ejecutar desde: C:\Users\PC\hospital-system1

Write-Host "🔧 Configurando UTF-8 en el backend..." -ForegroundColor Green

# Crear archivo main.ts actualizado
$mainTsContent = @"
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configurar CORS
  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
  });

  // Validación global
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log('');
  console.log('    🏥 Hospital Management System API');
  console.log('    🚀 Server: http://localhost:' + port);
  console.log('    📚 Docs: http://localhost:' + port + '/api/docs');
  console.log('');
}
bootstrap();
"@

# Guardar el archivo
Set-Content -Path "backend\src\main.ts" -Value $mainTsContent -Encoding UTF8

Write-Host "✅ Archivo main.ts actualizado" -ForegroundColor Green
Write-Host ""
Write-Host "🔄 Ahora ejecuta:" -ForegroundColor Cyan
Write-Host "  docker-compose restart backend" -ForegroundColor White
Write-Host "  docker-compose logs -f backend" -ForegroundColor White