import { Controller, Post, Get, Patch, Delete, Param, Body } from '@nestjs/common';
import { TiposVehiculoService } from './tipos-vehiculo.service';
import { CreateTipoVehiculoDto } from './dto/create-tipo-vehiculo.dto';
import { UpdateTipoVehiculoDto } from './dto/update-tipo-vehiculo.dto';

@Controller('tipos-vehiculo')
export class TiposVehiculoController {
  constructor(private readonly tiposVehiculoService: TiposVehiculoService) {}

  @Post()
  async create(@Body() createTipoVehiculoDto: CreateTipoVehiculoDto) {
    const tipoVehiculo = await this.tiposVehiculoService.create(createTipoVehiculoDto);
    return tipoVehiculo;
  }

  @Get()
  async findAll() {
    return this.tiposVehiculoService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: number) {
    return this.tiposVehiculoService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: number, @Body() updateTipoVehiculoDto: UpdateTipoVehiculoDto) {
    const tipoVehiculo = await this.tiposVehiculoService.update(id, updateTipoVehiculoDto);
    return tipoVehiculo;
  }

  @Delete(':id')
  async remove(@Param('id') id: number) {
    await this.tiposVehiculoService.remove(id);
    return { message: 'Tipo de vehículo eliminado con éxito.' };
  }
}
