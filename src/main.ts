import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { 
    bufferLogs: true,
    logger: ['error', 'warn', 'log'] // Asegura logs visibles
  });

  // Payloads grandes
  app.use(json({ limit: '10mb' }));

  // CORS abierto
  app.enableCors({ origin: true, credentials: true });

  // 🔥 CRITICAL: Swagger solo en desarrollo (causa lentitud en prod)
  if (process.env.NODE_ENV !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Documentación de la API')
      .setDescription('API generada automáticamente')
      .setVersion('1.0')
      .addTag('API')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api', app, document);
  }

  // Puerto dinámico de Railway
  const port = parseInt(process.env.PORT ?? '3000', 10);
  
  await app.listen(port, '0.0.0.0');

  console.log(`✅ API corriendo en puerto ${port}`);
  console.log(`🌍 Health check: http://localhost:${port}/`);
}

bootstrap().catch(err => {
  console.error('❌ Error fatal al iniciar:', err);
  process.exit(1);
});