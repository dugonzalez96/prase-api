import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IniciosCajaService } from './inicios-caja.service';
import { IniciosCajaController } from './inicios-caja.controller';
import { IniciosCaja } from './entities/inicios-caja.entity';
import { usuarios } from 'src/users/users.entity';
import { BitacoraEdiciones } from 'src/bitacora-ediciones/bitacora-ediciones.entity';
import { BitacoraEliminaciones } from 'src/bitacora-eliminaciones/bitacora-eliminaciones.entity'; 
import { Sucursal } from 'src/sucursales/entities/sucursales.entity';
import { Transacciones } from 'src/transacciones/entities/transacciones.entity';


@Module({
  imports: [TypeOrmModule.forFeature([IniciosCaja, usuarios,BitacoraEdiciones,BitacoraEliminaciones,Sucursal,Transacciones],'db1')],
  controllers: [IniciosCajaController],
  providers: [IniciosCajaService],
})
export class IniciosCajaModule {}
