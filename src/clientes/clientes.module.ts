import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientesService } from './clientes.service';
import { ClientesController } from './clientes.controller';
import { Clientes } from './clientes.entity';
import { BitacoraEliminacionesModule } from '../bitacora-eliminaciones/bitacora-eliminaciones.module'; // Importar el módulo de bitácora de eliminaciones
import { BitacoraEdicionesModule } from '../bitacora-ediciones/bitacora-ediciones.module'; // Importar el módulo de bitácora de ediciones



@Module({
  imports: [
    TypeOrmModule.forFeature([Clientes], 'db1'),
    BitacoraEliminacionesModule,
    BitacoraEdicionesModule
  ],
  controllers: [ClientesController],
  providers: [ClientesService],
  exports: [TypeOrmModule, ClientesService]
})
export class ClientesModule {}
