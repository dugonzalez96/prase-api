import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BitacoraEliminaciones } from 'src/bitacora-eliminaciones/bitacora-eliminaciones.entity';
import { BitacoraEdiciones } from 'src/bitacora-ediciones/bitacora-ediciones.entity';
import { TipoEmpleadoController } from './tipo-empleado.controller';
import { TipoEmpleado } from './entities/tipo-empleado.entity';
import { TipoEmpleadoService } from './tipo-empleado.service';

@Module({
  imports: [
    TypeOrmModule.forFeature(
      [TipoEmpleado, BitacoraEdiciones, BitacoraEliminaciones],
      'db1'
    ),
  ],
  controllers: [TipoEmpleadoController],
  providers: [TipoEmpleadoService],
  exports: [TypeOrmModule, TipoEmpleadoService],
})
export class TipoEmpleadoModule {}
