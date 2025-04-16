import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentosRequeridos } from './entities/documentos-requeridos.entity';
import { DocumentosRequeridosService } from './documentos-requeridos.service';
import { DocumentosRequeridosController } from './documentos-requeridos.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DocumentosRequeridos], 'db1')], // Asegúrate de usar el nombre de conexión correcto
  controllers: [DocumentosRequeridosController],
  providers: [DocumentosRequeridosService],
  exports: [TypeOrmModule], // Exporta el módulo para otros módulos si es necesario
})
export class DocumentosRequeridosModule {}
