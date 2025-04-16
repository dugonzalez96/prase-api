import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CortesUsuarios } from './entities/cortes-usuarios.entity';
import { CortesUsuariosService } from './cortes-usuarios.service';
import { CortesUsuariosController } from './cortes-usuarios.controller';
import { Transacciones } from 'src/transacciones/entities/transacciones.entity';
import { IniciosCaja } from 'src/inicios-caja/entities/inicios-caja.entity';
import { PagosPoliza } from 'src/pagos-poliza/entities/pagos-poliza.entity';
import { BitacoraEdiciones } from 'src/bitacora-ediciones/bitacora-ediciones.entity';
import { BitacoraEliminaciones } from 'src/bitacora-eliminaciones/bitacora-eliminaciones.entity';
import { usuarios } from 'src/users/users.entity';
import { Poliza } from 'src/polizas/entities/poliza.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CortesUsuarios,Transacciones,IniciosCaja,PagosPoliza,BitacoraEdiciones,BitacoraEliminaciones,usuarios,Poliza], 'db1')],
  controllers: [CortesUsuariosController],
  providers: [CortesUsuariosService],
})
export class CortesUsuariosModule {}
