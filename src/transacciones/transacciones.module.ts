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

@Module({
  imports: [
    TypeOrmModule.forFeature(
      [Transacciones, IniciosCaja, usuarios, CuentasBancarias],
      'db1',
    ),
    forwardRef(() => BitacoraEdicionesModule),
    forwardRef(() => BitacoraEliminacionesModule),
  ],
  controllers: [TransaccionesController],
  providers: [TransaccionesService],
})
export class TransaccionesModule {}
