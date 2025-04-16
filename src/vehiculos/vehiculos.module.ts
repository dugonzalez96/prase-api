import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VehiculosService } from './vehiculos.service';
import { VehiculosController } from './vehiculos.controller';
import { Vehiculos } from './vehiculos.entity';
import { BitacoraEliminacionesModule } from '../bitacora-eliminaciones/bitacora-eliminaciones.module'; // Importar el módulo de bitácora de eliminaciones
import { BitacoraEdicionesModule } from '../bitacora-ediciones/bitacora-ediciones.module'; // Importar el módulo de bitácora de ediciones



@Module({
  imports: [
    TypeOrmModule.forFeature([Vehiculos], 'db1'),
    BitacoraEliminacionesModule,
    BitacoraEdicionesModule
  ],
  controllers: [VehiculosController],
  providers: [VehiculosService],
  exports: [TypeOrmModule, VehiculosService]
})
export class VehiculosModule  {}
