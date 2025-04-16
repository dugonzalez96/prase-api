import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { CreateTransaccionDto } from './dto/create-transaccion.dto';
import { UpdateTransaccionDto } from './dto/update-transaccion.dto';
import { TransaccionesService } from './transacciones.service';
import { Transacciones } from './entities/transacciones.entity';

@Controller('transacciones')
export class TransaccionesController {
  constructor(private readonly transaccionesService: TransaccionesService) {}

  @Post()
  create(@Body() createTransaccionDto: CreateTransaccionDto) {
    return this.transaccionesService.create(createTransaccionDto);
  }

  @Get()
  findAll() {
    return this.transaccionesService.findAll();
  }

  @Get('usuario/:usuarioID')
  findByUserId(@Param('usuarioID') usuarioID: number) {
    return this.transaccionesService.findByUserId(usuarioID);
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.transaccionesService.findOne(id);
  }

  @Patch(':id/:usuario')
  async update(
    @Param('id') id: number,
    @Param('usuario') usuario: string,
    @Body() updateDto: UpdateTransaccionDto,
  ): Promise<Transacciones> {
    return this.transaccionesService.update(id, updateDto, usuario);
  }

  @Post('generar-codigo/:id')
  async generarCodigo(
    @Param('id') id: number,
  ): Promise<{ id: number; codigo: string }> {
    return await this.transaccionesService.generarCodigoAutorizacion(id);
  }

  @Delete(':id/:usuario')
  async remove(
    @Param('id') id: number,
    @Param('usuario') usuario: string,
    @Body() dto: { codigo: string; motivo?: string },
  ): Promise<string> {
    const { codigo, motivo } = dto;
    return this.transaccionesService.remove(id, usuario, motivo, codigo);
  }
}
