import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { EstatusPagoService } from './estatus-pago.service';

@Controller('estatus-pago')
export class EstatusPagoController {
  constructor(private readonly estatusPagoService: EstatusPagoService) {}

  @Get()
  findAll() {
    return this.estatusPagoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.estatusPagoService.findOne(id);
  }

  @Post()
  create(@Body() data: { NombreEstatus: string }) {
    return this.estatusPagoService.create(data);
  }

  @Patch(':id')
  update(@Param('id') id: number, @Body() data: { NombreEstatus: string }) {
    return this.estatusPagoService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.estatusPagoService.remove(id);
  }
}
