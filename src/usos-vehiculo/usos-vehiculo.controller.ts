import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { UsosVehiculoService } from './usos-vehiculo.service';
import { UsosVehiculo } from './usos-vehiculo.entity';

@Controller('usos-vehiculo')
export class UsosVehiculoController {
  constructor(private readonly usosVehiculoService: UsosVehiculoService) {}

  @Get()
  findAll(): Promise<UsosVehiculo[]> {
    return this.usosVehiculoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number): Promise<UsosVehiculo> {
    return this.usosVehiculoService.findOne(id);
  }

  @Post()
  create(@Body() usoVehiculo: UsosVehiculo): Promise<{ message: string }> {
    return this.usosVehiculoService.create(usoVehiculo);
  }

  @Patch(':id')
  update(
    @Param('id') id: number,
    @Body() usoVehiculo: Partial<UsosVehiculo>,
  ): Promise<{ message: string }> {
    return this.usosVehiculoService.update(id, usoVehiculo);
  }

  @Delete(':id')
  remove(@Param('id') id: number): Promise<{ message: string }> {
    return this.usosVehiculoService.remove(id);
  }
}
