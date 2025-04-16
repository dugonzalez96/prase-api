import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { MetodosPagoService } from './metodos-pago.service';

@Controller('metodos-pago')
export class MetodosPagoController {
  constructor(private readonly metodosPagoService: MetodosPagoService) {}

  @Get()
  findAll() {
    return this.metodosPagoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.metodosPagoService.findOne(id);
  }

  @Post()
  create(@Body() data: { NombreMetodo: string }) {
    return this.metodosPagoService.create(data);
  }

  @Patch(':id')
  update(@Param('id') id: number, @Body() data: { NombreMetodo: string }) {
    return this.metodosPagoService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.metodosPagoService.remove(id);
  }
}
