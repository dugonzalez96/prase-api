import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { EmpleadoService } from './empleado.service';
import { CreateEmpleadoDto, UpdateEmpleadoDto } from './dto/empleado.dto';

@Controller('empleados')
export class EmpleadoController {
  constructor(private readonly empleadoService: EmpleadoService) {}

  @Get()
  findAll() {
    return this.empleadoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.empleadoService.findOne(id);
  }

  @Post()
  create(@Body() createEmpleadoDto: CreateEmpleadoDto) {
    return this.empleadoService.create(createEmpleadoDto);
  }

  @Patch(':id')
  update(@Param('id') id: number, @Body() updateEmpleadoDto: UpdateEmpleadoDto) {
    return this.empleadoService.update(id, updateEmpleadoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.empleadoService.remove(id);
  }
}
