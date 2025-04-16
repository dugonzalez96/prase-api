import { Controller, Get, Post, Put, Delete, Param, Body, Patch } from '@nestjs/common';
import { VehiculosService } from './vehiculos.service';
import { Vehiculos } from './vehiculos.entity';

@Controller('vehiculos')
export class VehiculosController {
  constructor(private readonly vehiculosService: VehiculosService) {}

  @Get(':id')
  findOne(@Param('id') id: number): Promise<Vehiculos> {
    return this.vehiculosService.findOne(id);
  }

  @Patch(':id/:usuario')
  update(
    @Param('id') id: number, 
    @Param('usuario') usuario: string,
    @Body() vehiculo: Partial<Vehiculos>
  ): Promise<Vehiculos> {
    return this.vehiculosService.update(id, vehiculo, usuario);
  }

  @Delete(':id/:usuario')
  async remove(
    @Param('id') id: number,
    @Param('usuario') usuario: string,
    @Body('motivo') motivo?: string
  ): Promise<{ message: string }> {
    await this.vehiculosService.remove(id, usuario, motivo);
    return { message: `El vehículo con ID ${id} ha sido eliminado exitosamente por ${usuario}.` };
  }

  @Post()
  create(@Body() vehiculo: Partial<Vehiculos>): Promise<Vehiculos> {
    return this.vehiculosService.create(vehiculo);
  }

  @Get()
  findAll(): Promise<Vehiculos[]> {
    return this.vehiculosService.findAll();
  }
}
