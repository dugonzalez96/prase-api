import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { envs } from '../config/envs';
import { grupos_has_usuarios } from 'src/users/users_groups.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApplicationsGruposModule } from 'src/aplicaciones-grupos/aplicaciones-grupos.module';
import { ApplicationsGrupos } from 'src/aplicaciones-grupos/aplicaciones-grupos.entity';
import { Empleado } from 'src/empleados/entity/empleado.entity';
import { TiposMoneda } from 'src/tipos-moneda/tipos-moneda.entity';
import { TipoEmpleado } from 'src/tipo-empleado/entities/tipo-empleado.entity';
import { Sucursal } from 'src/sucursales/entities/sucursales.entity';

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([grupos_has_usuarios,ApplicationsGrupos,Empleado,TipoEmpleado,Sucursal], 'db1'), // Si utilizas esta entidad
    JwtModule.register({
      secret: envs.TOKEN_SECRET_KEY, // Cambia esto a una clave más segura y mantenla en .env
      signOptions: { expiresIn: '3600s' }, // Token expirará en 3600 segundos
    }),
  ],
  providers: [AuthService],
  controllers: [AuthController]
})
export class AuthModule {}
