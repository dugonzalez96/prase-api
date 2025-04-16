import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmpleadoService } from './empleado.service';
import { EmpleadoController } from './empleado.controller';
import { BitacoraEliminaciones } from 'src/bitacora-eliminaciones/bitacora-eliminaciones.entity';
import { BitacoraEdiciones } from 'src/bitacora-ediciones/bitacora-ediciones.entity';
import { Empleado } from './entity/empleado.entity';
import { TipoEmpleado } from 'src/tipo-empleado/entities/tipo-empleado.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature(
      [Empleado, TipoEmpleado, BitacoraEdiciones, BitacoraEliminaciones],
      'db1'
    ),
  ],
  controllers: [EmpleadoController],
  providers: [EmpleadoService],
  exports: [TypeOrmModule, EmpleadoService],
})
export class EmpleadoModule {}
