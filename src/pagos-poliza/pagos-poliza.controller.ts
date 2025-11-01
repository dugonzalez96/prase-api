import { Controller, Get, Post, Patch, Delete, Body, Param, Query, HttpException, HttpStatus, ParseIntPipe } from '@nestjs/common';
import { PagosPolizaService } from './pagos-poliza.service';
import { CreatePagosPolizaDto, UpdatePagosPolizaDto } from './dto/pagos-poliza.dto';
import { PagosPoliza } from './entities/pagos-poliza.entity';

@Controller('pagos-poliza')
export class PagosPolizaController {
  constructor(private readonly pagosPolizaService: PagosPolizaService) { }

  @Post()
  create(@Body() createDto: CreatePagosPolizaDto) {
    return this.pagosPolizaService.create(createDto);
  }

  @Get()
  findAll() {
    return this.pagosPolizaService.findAll();
  }

  @Get('usuario/:usuarioID')
  async getPagosByUsuario(@Param('usuarioID') usuarioID: number): Promise<PagosPoliza[]> {
    if (!usuarioID) {
      throw new HttpException('El ID de usuario es obligatorio', HttpStatus.BAD_REQUEST);
    }
    return await this.pagosPolizaService.getPagosByUsuario(usuarioID);
  }

  @Get(':id(\\d+)')
  findOne(@Param('id', ParseIntPipe) id: number) { 
    return this.pagosPolizaService.findOne(id);
  }

@Get('poliza/:polizaId/total')
getTotalMontoByPolizaId(@Param('polizaId') polizaId: number) {
  return this.pagosPolizaService.getTotalMontoByPolizaId(polizaId);
}

@Get('poliza/:polizaId')
getPagosByPolizaId(@Param('polizaId') polizaId: number) {
  return this.pagosPolizaService.getPagosByPolizaId(polizaId);
}

@Patch(':id')
update(@Param('id') id: number, @Body() updateDto: UpdatePagosPolizaDto) {
  return this.pagosPolizaService.update(id, updateDto);
}

@Delete(':id')
cancelPago(
  @Param('id') id: number,
  @Body() body: { usuarioId: number; motivoCancelacion: string },
) {
  const { usuarioId, motivoCancelacion } = body;
  return this.pagosPolizaService.cancelPago(id, usuarioId, motivoCancelacion);
}

@Get('no-validados-no-efectivo')
async noValidadosNoEfectivo(
  @Query('fechaInicio') fechaInicio ?: string,
  @Query('fechaFin') fechaFin ?: string,
  @Query('usuarioID') usuarioID ?: string,
  @Query('polizaID') polizaID ?: string,
) {
  return this.pagosPolizaService.getPagosSinValidarNoEfectivo({
    fechaInicio: fechaInicio ? new Date(fechaInicio) : undefined,
    fechaFin: fechaFin ? new Date(fechaFin) : undefined,
    usuarioID: usuarioID ? Number(usuarioID) : undefined,
    polizaID: polizaID ? Number(polizaID) : undefined,
  });
}
}
