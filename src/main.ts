import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json } from 'express';

async function bootstrap() {
  // bufferLogs ayuda a no perder logs al inicio en entornos como Railway
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // Payloads grandes (ajusta si necesitas más)
  app.use(json({ limit: '10mb' }));

  // CORS abierto (ajusta origin si quieres restringir)
  app.enableCors({ origin: true, credentials: true });

  // Swagger (si prefieres ocultarlo en prod, pon el if de NODE_ENV)
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Documentación de la API')
    .setDescription('API generada automáticamente para todas las carpetas y controladores')
    .setVersion('1.0')
    .addTag('API')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document); // https://<host>/api

  // 🚀 Puerto dinámico de Railway (+ fallback local) y host 0.0.0.0
  const port = parseInt(process.env.PORT ?? '3000', 10);
  await app.listen(port, '0.0.0.0');

  console.log(`API escuchando en puerto ${port}`);
}

bootstrap();
