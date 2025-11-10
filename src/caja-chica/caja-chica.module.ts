import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CajaChicaController } from './caja-chica.controller';
import { CajaChica } from './entities/caja-chica.entity';
import { usuarios } from 'src/users/users.entity';
import { IniciosCaja } from 'src/inicios-caja/entities/inicios-caja.entity';
import { Transacciones } from 'src/transacciones/entities/transacciones.entity';
import { PagosPoliza } from 'src/pagos-poliza/entities/pagos-poliza.entity';
import { Poliza } from 'src/polizas/entities/poliza.entity';
import { BitacoraEdiciones } from 'src/bitacora-ediciones/bitacora-ediciones.entity';
import { BitacoraEliminaciones } from 'src/bitacora-eliminaciones/bitacora-eliminaciones.entity';
import { CortesUsuarios } from 'src/corte-caja/entities/cortes-usuarios.entity';
import { CortesUsuariosService } from 'src/corte-caja/cortes-usuarios.service';
import { CajaChicaService } from './caja-chica.service';
import { Sucursal } from 'src/sucursales/entities/sucursales.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature(
      [
        CajaChica,
        CortesUsuarios,
        usuarios,
        IniciosCaja,
        Transacciones,
        PagosPoliza,
        Poliza,
        BitacoraEdiciones,
        BitacoraEliminaciones,
        Sucursal
      ],
      'db1',
    ),
  ],
  controllers: [CajaChicaController],
  providers: [CajaChicaService, CortesUsuariosService],
})
export class CajaChicaModule {}
