import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PagosPoliza } from './entities/pagos-poliza.entity';
import { PagosPolizaService } from './pagos-poliza.service';
import { PagosPolizaController } from './pagos-poliza.controller';
import { MetodosPago } from '../metodos-pago/entities/metodos-pago.entity';
import { EstatusPago } from '../estatus-pago/entities/estatus-pago.entity';
import { usuarios } from 'src/users/users.entity';
import { BitacoraEdiciones } from 'src/bitacora-ediciones/bitacora-ediciones.entity';
import { BitacoraEliminaciones } from 'src/bitacora-eliminaciones/bitacora-eliminaciones.entity';
import { Poliza } from 'src/polizas/entities/poliza.entity';
import { CuentasBancarias } from 'src/cuentas-bancarias/entities/cuentas-bancarias.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([PagosPoliza, MetodosPago, EstatusPago,usuarios,BitacoraEliminaciones,BitacoraEdiciones,Poliza,CuentasBancarias], 'db1'),
  ],
  controllers: [PagosPolizaController],
  providers: [PagosPolizaService],
  exports: [PagosPolizaService],
})
export class PagosPolizaModule {}
