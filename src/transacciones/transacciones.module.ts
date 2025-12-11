import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransaccionesService } from './transacciones.service';
import { TransaccionesController } from './transacciones.controller';
import { Transacciones } from './entities/transacciones.entity';
import { IniciosCaja } from 'src/inicios-caja/entities/inicios-caja.entity';
import { usuarios } from 'src/users/users.entity';
import { CuentasBancarias } from 'src/cuentas-bancarias/entities/cuentas-bancarias.entity';
import { BitacoraEdicionesModule } from 'src/bitacora-ediciones/bitacora-ediciones.module';
import { BitacoraEliminacionesModule } from 'src/bitacora-eliminaciones/bitacora-eliminaciones.module';
import { BitacoraEdiciones } from 'src/bitacora-ediciones/bitacora-ediciones.entity';
import { BitacoraEliminaciones } from 'src/bitacora-eliminaciones/bitacora-eliminaciones.entity';
import { Sucursal } from 'src/sucursales/entities/sucursales.entity';
import { CajaChica } from 'src/caja-chica/entities/caja-chica.entity';
import { CajaGeneral } from 'src/caja-general/entities/caja-general.entity';
import { CortesUsuarios } from 'src/corte-caja/entities/cortes-usuarios.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature(
      [
        Transacciones,
        IniciosCaja,
        usuarios,
        CuentasBancarias,
        BitacoraEdiciones,
        BitacoraEliminaciones,
        Sucursal,
        CajaChica, // 🔹 FASE 2: Para validar cuadres cerrados
        CajaGeneral, // 🔹 FASE 2: Para validar cuadres cerrados
        CortesUsuarios, // 🔹 FASE 3: Para validar inmutabilidad
      ],
      'db1',
    ),
    forwardRef(() => BitacoraEdicionesModule),
    forwardRef(() => BitacoraEliminacionesModule),
  ],
  controllers: [TransaccionesController],
  providers: [TransaccionesService],
})
export class TransaccionesModule {}
