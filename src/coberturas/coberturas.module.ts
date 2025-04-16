import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Coberturas } from './coberturas.entity';
import { CoberturasService } from './coberturas.service';
import { CoberturasController } from './coberturas.controller';
import { BitacoraEliminacionesModule } from '../bitacora-eliminaciones/bitacora-eliminaciones.module';
import { BitacoraEdicionesModule } from '../bitacora-ediciones/bitacora-ediciones.module';
import { TiposMoneda } from 'src/tipos-moneda/tipos-moneda.entity';
import { TiposDeducible } from 'src/tipos-deducible/tipos-deducible.entity';


@Module({
  imports: [
    TypeOrmModule.forFeature([Coberturas,TiposDeducible, TiposMoneda], 'db1'),
    BitacoraEliminacionesModule,
    BitacoraEdicionesModule
  ],
  controllers: [CoberturasController],
  providers: [CoberturasService],
  exports: [TypeOrmModule, CoberturasService]
})
export class CoberturasModule  {}
