import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { usuarios } from "./users.entity";
import { grupos_has_usuarios } from './users_groups.entity';
import { grupos } from 'src/groups/groups.entity';
import { Empleado } from 'src/empleados/entity/empleado.entity';
import { Sucursal } from 'src/sucursales/entities/sucursales.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([usuarios, grupos_has_usuarios,grupos,Empleado, Sucursal], 'db1'), // Asegúrate de usar la conexión correcta
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService], // Asegúrate de exportar el servicio
})
// prueba deploy automatico
export class UsersModule {}
