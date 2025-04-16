import { Controller, Get, Param } from '@nestjs/common';
import { TipoEmpleadoService } from './tipo-empleado.service';

@Controller('tipos-empleado')
export class TipoEmpleadoController {
  constructor(private readonly tipoEmpleadoService: TipoEmpleadoService) {}

  @Get()
  findAll() {
    return this.tipoEmpleadoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.tipoEmpleadoService.findOne(id);
  }
}
