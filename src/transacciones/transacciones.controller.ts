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
  BadRequestException,
} from '@nestjs/common';
import { CreateTransaccionDto } from './dto/create-transaccion.dto';
import { UpdateTransaccionDto } from './dto/update-transaccion.dto';
import { TransaccionesService } from './transacciones.service';
import { Transacciones } from './entities/transacciones.entity';

@Controller('transacciones')
export class TransaccionesController {
  constructor(private readonly transaccionesService: TransaccionesService) { }

  @Post()
  async create(@Body() createTransaccionDto: CreateTransaccionDto) {
    try {
      console.log('📥 POST /transacciones - Body recibido:', JSON.stringify(createTransaccionDto, null, 2));
      const result = await this.transaccionesService.create(createTransaccionDto);
      console.log('✅ Transacción creada exitosamente:', result.TransaccionID);
      return {
        success: true,
        message: 'Transacción creada exitosamente',
        data: result,
      };
    } catch (error) {
      console.error('❌ Error al crear transacción:', {
        message: error.message,
        stack: error.stack,
        dto: JSON.stringify(createTransaccionDto),
      });

      // Extraer el mensaje del error
      let errorMessage = error.message;
      let errorCode = 'TRANSACTION_ERROR';
      let statusCode = HttpStatus.BAD_REQUEST;

      // Si es HttpException, extraer información
      if (error instanceof HttpException) {
        const response = error.getResponse();
        statusCode = error.getStatus();

        if (typeof response === 'string') {
          errorMessage = response;
        } else if (typeof response === 'object' && response !== null) {
          errorMessage = (response as any).message || error.message;
        }

        // Determinar código de error según el mensaje
        if (errorMessage.includes('no encontrado') || errorMessage.includes('not found')) {
          errorCode = 'NOT_FOUND';
        } else if (errorMessage.includes('Caja Chica')) {
          errorCode = 'CAJA_CHICA_CERRADA';
        } else if (errorMessage.includes('Caja General')) {
          errorCode = 'CAJA_GENERAL_CERRADA';
        } else if (errorMessage.includes('sucursal')) {
          errorCode = 'SIN_SUCURSAL';
        } else if (errorMessage.includes('obligatorio')) {
          errorCode = 'CAMPO_REQUERIDO';
        } else if (errorMessage.includes('monto')) {
          errorCode = 'MONTO_INVALIDO';
        }
      }

      throw new HttpException(
        {
          success: false,
          errorCode,
          message: errorMessage,
          details: error.message,
          timestamp: new Date().toISOString(),
        },
        statusCode,
      );
    }
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
