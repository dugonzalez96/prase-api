import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { SucursalesService } from './sucursales.service';
import { CreateSucursalDto } from './dto/create-sucursal.dto';
import { UpdateSucursalDto } from './dto/update-sucursal.dto';

@Controller('sucursales')
export class SucursalesController {
  constructor(private readonly sucursalesService: SucursalesService) {}

  @Get()
  findAll() {
    return this.sucursalesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.sucursalesService.findOne(id);
  }

  @Post()
  create(@Body() createDto: CreateSucursalDto) {
    return this.sucursalesService.create(createDto);
  }

  @Patch(':id')
  update(@Param('id') id: number, @Body() updateDto: UpdateSucursalDto) {
    return this.sucursalesService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.sucursalesService.remove(id);
  }
}
