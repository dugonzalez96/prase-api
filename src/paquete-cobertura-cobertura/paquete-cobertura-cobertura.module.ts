import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaqueteCobertura_Cobertura } from './paquete-cobertura-cobertura.entity';
import { PaqueteCobertura_CoberturaService } from './paquete-cobertura-cobertura.service';
import { PaqueteCobertura_CoberturaController } from './paquete-cobertura-cobertura.controller';
import { BitacoraEliminacionesModule } from '../bitacora-eliminaciones/bitacora-eliminaciones.module';
import { BitacoraEdicionesModule } from '../bitacora-ediciones/bitacora-ediciones.module';


@Module({
  imports: [
    TypeOrmModule.forFeature([PaqueteCobertura_Cobertura], 'db1'),
    BitacoraEliminacionesModule,
    BitacoraEdicionesModule
  ],
  controllers: [PaqueteCobertura_CoberturaController],
  providers: [PaqueteCobertura_CoberturaService],
  exports: [TypeOrmModule, PaqueteCobertura_CoberturaService]
})
export class PaqueteCobertura_CoberturaModule  {}
