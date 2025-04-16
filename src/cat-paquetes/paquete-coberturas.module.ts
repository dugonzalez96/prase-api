import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaqueteCoberturas } from './paquete-coberturas.entity';
import { PaqueteCoberturasService } from './paquete-coberturas.service';
import { PaqueteCoberturasController } from './paquete-coberturas.controller';
import { BitacoraEliminacionesModule } from '../bitacora-eliminaciones/bitacora-eliminaciones.module';  // Importa el módulo
import { BitacoraEdicionesModule  } from '../bitacora-ediciones/bitacora-ediciones.module';  // Importa el módulo


@Module({
  imports: [
    TypeOrmModule.forFeature([PaqueteCoberturas], 'db1'),
    BitacoraEliminacionesModule,
    BitacoraEdicionesModule
  ],
  controllers: [PaqueteCoberturasController],
  providers: [PaqueteCoberturasService],
  exports: [TypeOrmModule, PaqueteCoberturasService]
})
export class PaqueteCoberturasModule {}
