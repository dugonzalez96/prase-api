import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsosVehiculo } from './usos-vehiculo.entity';
import { UsosVehiculoService } from './usos-vehiculo.service';
import { UsosVehiculoController } from './usos-vehiculo.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UsosVehiculo], 'db1')],
  providers: [UsosVehiculoService],
  controllers: [UsosVehiculoController],
})
export class UsosVehiculoModule {}
