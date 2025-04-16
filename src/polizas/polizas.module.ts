import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Poliza } from './entities/poliza.entity';
import { PolizasService } from './polizas.service';
import { PolizasController } from './polizas.controller';
import { BitacoraEdicionesModule } from '../bitacora-ediciones/bitacora-ediciones.module';
import { BitacoraEliminacionesModule } from '../bitacora-eliminaciones/bitacora-eliminaciones.module';
import { DetallesCotizacionPoliza } from 'src/cotizaciones/entities/detalle-cotizacion-poliza.entity';
import { Cotizacion } from 'src/cotizaciones/entities/cotizacion.entity';
import { TipoPago } from 'src/tipos-pago/tipo-pago.entity';
import { PolizaHistorial } from './entities/poliza-historial.entity';
import { Vehiculos } from 'src/vehiculos/vehiculos.entity';
import { Clientes } from 'src/clientes/clientes.entity';
import { PagosPoliza } from 'src/pagos-poliza/entities/pagos-poliza.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Poliza, DetallesCotizacionPoliza,PolizaHistorial, Cotizacion, TipoPago,Vehiculos,Clientes,PagosPoliza], 'db1'),
    forwardRef(() => BitacoraEdicionesModule),
    forwardRef(() => BitacoraEliminacionesModule),
  ],
  controllers: [PolizasController],
  providers: [PolizasService],
  exports: [TypeOrmModule, PolizasService],
})
export class PolizasModule {}
