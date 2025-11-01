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
  Query,
} from '@nestjs/common';
import { CreateTransaccionDto } from './dto/create-transaccion.dto';
import { UpdateTransaccionDto } from './dto/update-transaccion.dto';
import { TransaccionesService } from './transacciones.service';
import { Transacciones } from './entities/transacciones.entity';

@Controller('transacciones')
export class TransaccionesController {
  constructor(private readonly transaccionesService: TransaccionesService) { }

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

  // Ejemplo de uso:
  // GET /transacciones/movimientos/pendientes?fechaInicio=2025-10-01&fechaFin=2025-10-31&usuarioID=12
  @Get('movimientos/pendientes')
  async listarPendientes(
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
    @Query('usuarioID') usuarioID?: string,
  ): Promise<Transacciones[]> {
    return this.transaccionesService.listarMovimientosPendientes({
      fechaInicio,
      fechaFin,
      usuarioID: usuarioID ? Number(usuarioID) : undefined,
    });
    // Nota: estas son solo consultas; la bitácora de ediciones sigue registrándose en PATCH /update.
  }

  // GET /transacciones/movimientos/validados?fechaInicio=2025-10-01&fechaFin=2025-10-31&usuarioID=12
  @Get('movimientos/validados')
  async listarValidados(
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
    @Query('usuarioID') usuarioID?: string,
  ): Promise<Transacciones[]> {
    return this.transaccionesService.listarMovimientosValidados({
      fechaInicio,
      fechaFin,
      usuarioID: usuarioID ? Number(usuarioID) : undefined,
    });
  }
}
