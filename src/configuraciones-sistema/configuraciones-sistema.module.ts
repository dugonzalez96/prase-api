import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfiguracionesSistema } from './configuraciones-sistema.entity';
import { ConfiguracionesSistemaService } from './configuraciones-sistema.service';
import { ConfiguracionesSistemaController } from './configuraciones-sistema.controller';
import { BitacoraEliminacionesModule } from '../bitacora-eliminaciones/bitacora-eliminaciones.module';  // Importar el módulo de bitácora de eliminaciones
import { BitacoraEdicionesModule } from '../bitacora-ediciones/bitacora-ediciones.module';  // Importar el módulo de bitácora de ediciones



@Module({
  imports: [
    TypeOrmModule.forFeature([ConfiguracionesSistema], 'db1'),
    BitacoraEliminacionesModule,  // Importar el módulo de bitácora de eliminaciones
    BitacoraEdicionesModule,  // Importar el módulo de bitácora de ediciones
  ],
  controllers: [ConfiguracionesSistemaController],
  providers: [ConfiguracionesSistemaService],
  exports: [TypeOrmModule, ConfiguracionesSistemaService]
})
export class ConfiguracionesSistemaModule   {}
