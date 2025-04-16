import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AplicacionReglas } from './aplicacion-reglas.entity';
import { AplicacionReglasService } from './aplicacion-reglas.service';
import { AplicacionReglasController } from './aplicacion-reglas.controller';


@Module({
  imports: [
    TypeOrmModule.forFeature([AplicacionReglas], 'db1')
  ],
  controllers: [AplicacionReglasController],
  providers: [AplicacionReglasService],
  exports: [TypeOrmModule, AplicacionReglasService]
})
export class AplicacionReglasModule  {}
