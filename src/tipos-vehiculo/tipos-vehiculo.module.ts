import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TiposVehiculo } from './tipos-vehiculo.entity';
import { UsosVehiculo } from '../usos-vehiculo/usos-vehiculo.entity';
import { TiposVehiculoService } from './tipos-vehiculo.service';
import { TiposVehiculoController } from './tipos-vehiculo.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TiposVehiculo, UsosVehiculo], 'db1')],
  providers: [TiposVehiculoService],
  controllers: [TiposVehiculoController],
})
export class TiposVehiculoModule {}
