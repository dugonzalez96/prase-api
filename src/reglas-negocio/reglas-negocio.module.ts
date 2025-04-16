import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReglasNegocio } from './reglas-negocio.entity';
import { ReglasNegocioService } from './reglas-negocio.service';
import { ReglasNegocioController } from './reglas-negocio.controller';
import { CondicionesReglasModule } from '../condiciones-reglas/condiciones-reglas.module'; // Importar el módulo
import { CondicionesReglas } from 'src/condiciones-reglas/condiciones-reglas.entity';
import { Coberturas } from 'src/coberturas/coberturas.entity';


@Module({
  imports: [
    TypeOrmModule.forFeature([ReglasNegocio,CondicionesReglas,Coberturas], 'db1'),
    forwardRef(() => CondicionesReglasModule) ,

  ],
  controllers: [ReglasNegocioController],
  providers: [ReglasNegocioService],
  exports: [TypeOrmModule, ReglasNegocioService]
})
export class ReglasNegocioModule  {}
