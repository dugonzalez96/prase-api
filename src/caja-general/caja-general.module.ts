import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CajaGeneral } from './entities/caja-general.entity';
import { CajaGeneralService } from './caja-general.service';
import { CajaGeneralController } from './caja-general.controller';

import { CajaChica } from 'src/caja-chica/entities/caja-chica.entity';
import { Transacciones } from 'src/transacciones/entities/transacciones.entity';
import { PagosPoliza } from 'src/pagos-poliza/entities/pagos-poliza.entity';
import { Sucursal } from 'src/sucursales/entities/sucursales.entity';
import { usuarios } from 'src/users/users.entity';
import { IniciosCaja } from 'src/inicios-caja/entities/inicios-caja.entity';
import { CortesUsuarios } from 'src/corte-caja/entities/cortes-usuarios.entity';
import { BitacoraEdiciones } from 'src/bitacora-ediciones/bitacora-ediciones.entity';
import { BitacoraEliminaciones } from 'src/bitacora-eliminaciones/bitacora-eliminaciones.entity';
import { CuentasBancarias } from 'src/cuentas-bancarias/entities/cuentas-bancarias.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature(
      [
        CajaGeneral,
        CajaChica,
        CortesUsuarios,
        Transacciones,
        PagosPoliza,
        Sucursal,
        usuarios,
        IniciosCaja,
        BitacoraEdiciones,
        BitacoraEliminaciones,
        CuentasBancarias
      ],
      'db1', // 👈 MUY IMPORTANTE: misma conexión que usas en el service
    ),
  ],
  controllers: [CajaGeneralController],
  providers: [CajaGeneralService],
  exports: [CajaGeneralService],
})
export class CajaGeneralModule {}
