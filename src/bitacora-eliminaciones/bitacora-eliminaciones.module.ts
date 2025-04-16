import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BitacoraEliminaciones } from './bitacora-eliminaciones.entity';
import { BitacoraEliminacionesService } from './bitacora-eliminaciones.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([BitacoraEliminaciones], 'db1'),  
  ],  // Registrar la entidad
  providers: [BitacoraEliminacionesService],  // Proveer el servicio
  exports: [TypeOrmModule,BitacoraEliminacionesService],  // Exportar el servicio para que otros módulos lo utilicen
})
export class BitacoraEliminacionesModule {}
