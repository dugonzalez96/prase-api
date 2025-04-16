import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { CotizacionesService } from './cotizaciones.service';
import { CreateCotizacionDto } from './dto/create-cotizacion.dto';
import { UpdateCotizacionDto } from './dto/update-cotizacion.dto';

@ApiTags('Cotizaciones')
@Controller('cotizaciones')
export class CotizacionesController {
  constructor(private readonly cotizacionesService: CotizacionesService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una nueva cotización' })
  @ApiResponse({ status: 201, description: 'La cotización ha sido creada.' })
  @ApiBody({ type: CreateCotizacionDto })
  create(@Body() createCotizacionDto: CreateCotizacionDto) {
    return this.cotizacionesService.create(createCotizacionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las cotizaciones' })
  @ApiResponse({ status: 200, description: 'Lista de cotizaciones.' })
  findAll() {
    return this.cotizacionesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una cotización por ID' })
  @ApiParam({ name: 'id', description: 'ID de la cotización' })
  @ApiResponse({ status: 200, description: 'Detalles de la cotización.' })
  findOne(@Param('id') id: string) {
    return this.cotizacionesService.findOne(+id);
  }

  @Patch(':id/:usuario')
  @ApiOperation({ summary: 'Actualizar una cotización' })
  @ApiParam({ name: 'id', description: 'ID de la cotización' })
  @ApiParam({ name: 'usuario', description: 'Usuario que realiza la actualización' })
  @ApiBody({ type: UpdateCotizacionDto })
  @ApiResponse({ status: 200, description: 'La cotización ha sido actualizada.' })
  update(
    @Param('id') id: string,
    @Param('usuario') usuario: string,
    @Body() updateCotizacionDto: UpdateCotizacionDto,
  ) {
    return this.cotizacionesService.update(+id, updateCotizacionDto, usuario);
  }

  @Delete(':id/:usuario')
  @ApiOperation({ summary: 'Eliminar una cotización' })
  @ApiParam({ name: 'id', description: 'ID de la cotización' })
  @ApiParam({ name: 'usuario', description: 'Usuario que realiza la eliminación' })
  @ApiBody({ schema: { type: 'object', properties: { motivo: { type: 'string' } } } })
  @ApiResponse({ status: 200, description: 'La cotización ha sido eliminada.' })
  remove(@Param('id') id: string, @Param('usuario') usuario: string, @Body('motivo') motivo?: string) {
    return this.cotizacionesService.remove(+id, usuario, motivo);
  }

  @Patch(':id/estado')
  @ApiOperation({ summary: 'Actualizar el estado de una cotización' })
  @ApiParam({ name: 'id', description: 'ID de la cotización' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        nuevoEstado: {
          type: 'string',
          enum: ['REGISTRO', 'EMITIDA', 'ACEPTADA', 'ACTIVA', 'RECHAZADA'],
          example: 'ACTIVA',
        },
        usuario: { type: 'string', example: 'admin' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'El estado de la cotización ha sido actualizado.' })
  async updateStatus(
    @Param('id') id: number,
    @Body() body: { nuevoEstado: 'REGISTRO' | 'EMITIDA' | 'ACEPTADA' | 'ACTIVA' | 'RECHAZADA'; usuario: string },
  ) {
    const { nuevoEstado, usuario } = body;
    return this.cotizacionesService.updateStatus(id, nuevoEstado, usuario);
  }
}
