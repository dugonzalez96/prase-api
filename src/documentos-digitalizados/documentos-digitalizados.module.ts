import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentosDigitalizadosService } from './documentos-digitalizados.service';
import { DocumentosDigitalizadosController } from './documentos-digitalizados.controller';
import { DocumentosDigitalizados } from './entities/documentos-digitalizados.entity';
import { DocumentosRequeridos } from 'src/documentos-requeridos/entities/documentos-requeridos.entity';
import { Poliza } from 'src/polizas/entities/poliza.entity';
import { DocumentosRequeridosModule } from 'src/documentos-requeridos/documentos-requeridos.module';

@Module({
  imports: [
    TypeOrmModule.forFeature(
      [DocumentosDigitalizados, Poliza, DocumentosRequeridos],
      'db1',
    ),
    DocumentosRequeridosModule
  ],
  controllers: [DocumentosDigitalizadosController],
  providers: [DocumentosDigitalizadosService],
})
export class DocumentosDigitalizadosModule {}
