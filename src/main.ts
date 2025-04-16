import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { envs } from './config/envs';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(json({ limit: '10mb' }));

  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('Documentación de la API')
    .setDescription(
      'API generada automáticamente para todas las carpetas y controladores',
    )
    .setVersion('1.0')
    .addTag('API')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  await app.listen(envs.PORT);
}
bootstrap();


/*import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configuración básica para CORS y prefijos globales
  app.enableCors();
  app.setGlobalPrefix('api');

  // Habilitar Swagger solo en entornos no productivos
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Documentación de la API')
      .setDescription('Descripción general de la API')
      .setVersion('1.0')
      .addBearerAuth() // Agregar soporte para autenticación
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document); // URL: /api/docs
  }

  const PORT = process.env.PORT || 3000;
  await app.listen(PORT);
  console.log(`Aplicación escuchando en http://localhost:${PORT}`);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Swagger disponible en http://localhost:${PORT}/api/docs`);
  }
}
bootstrap();
*/