import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SucursalesService } from './sucursales.service';
import { SucursalesController } from './sucursales.controller';
import { Sucursal } from './entities/sucursales.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Sucursal],'db1')],
  controllers: [SucursalesController],
  providers: [SucursalesService],
})
export class SucursalesModule {}
