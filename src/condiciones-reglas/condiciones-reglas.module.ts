import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CondicionesReglas } from './condiciones-reglas.entity';
import { CondicionesReglasService } from './condiciones-reglas.service';
import { CondicionesReglasController } from './condiciones-reglas.controller';
import { ReglasNegocio } from '../reglas-negocio/reglas-negocio.entity';
import { ReglasNegocioModule } from '../reglas-negocio/reglas-negocio.module';  // Importamos el módulo
import { TiposMoneda } from 'src/tipos-moneda/tipos-moneda.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([CondicionesReglas, ReglasNegocio,TiposMoneda], 'db1'),
    forwardRef(() => ReglasNegocioModule)   
  ],
  controllers: [CondicionesReglasController],
  providers: [CondicionesReglasService],
  exports: [TypeOrmModule, CondicionesReglasService]
})
export class CondicionesReglasModule   {}
