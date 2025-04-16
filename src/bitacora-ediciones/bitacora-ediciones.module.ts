import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BitacoraEdiciones } from './bitacora-ediciones.entity';
import { BitacoraEdicionesService } from './bitacora-ediciones.service';


@Module({
  imports: [
    TypeOrmModule.forFeature([BitacoraEdiciones], 'db1'),  
  ],  // Registrar la entidad
  providers: [BitacoraEdicionesService],  // Proveer el servicio
  exports: [TypeOrmModule,BitacoraEdicionesService],  // Exportar el servicio para que otros módulos lo utilicen
})
export class BitacoraEdicionesModule {}
