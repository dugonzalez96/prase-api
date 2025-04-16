import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TipoPagoService } from './tipo-pago.service';
import { CreateTipoPagoDto } from './dto/create-tipo-pago.dto';
import { UpdateTipoPagoDto } from './dto/update-tipo-pago.dto';

@Controller('tipo-pago')
export class TipoPagoController {
  constructor(private readonly tipoPagoService: TipoPagoService) {}

  @Post()
  async create(@Body() createTipoPagoDto: CreateTipoPagoDto) {
    const nuevoTipoPago = await this.tipoPagoService.create(createTipoPagoDto);
    return { message: 'Tipo de Pago creado exitosamente', nuevoTipoPago };
  }

  @Get()
  findAll() {
    return this.tipoPagoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.tipoPagoService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: number, @Body() updateTipoPagoDto: UpdateTipoPagoDto) {
    const tipoPagoActualizado = await this.tipoPagoService.update(id, updateTipoPagoDto);
    return { message: 'Tipo de Pago actualizado exitosamente', tipoPagoActualizado };
  }

  @Delete(':id')
  async remove(@Param('id') id: number) {
    await this.tipoPagoService.remove(id);
    return { message: `Tipo de Pago con ID ${id} eliminado exitosamente` };
  }
}
