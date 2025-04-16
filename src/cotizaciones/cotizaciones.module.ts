import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CotizacionesService } from './cotizaciones.service';
import { CotizacionesController } from './cotizaciones.controller';
import { Cotizacion } from './entities/cotizacion.entity';
import { DetallesCotizacionPoliza } from './entities/detalle-cotizacion-poliza.entity';
import { BitacoraEliminaciones } from 'src/bitacora-eliminaciones/bitacora-eliminaciones.entity';
import { BitacoraEdiciones } from 'src/bitacora-ediciones/bitacora-ediciones.entity';
import { Empleado } from 'src/empleados/entity/empleado.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Cotizacion,DetallesCotizacionPoliza,BitacoraEdiciones,BitacoraEliminaciones,Empleado], 'db1')
  ],
  controllers: [CotizacionesController],
  providers: [CotizacionesService],
  exports: [TypeOrmModule, CotizacionesService]
})
export class CotizacionesModule    {}
