// src/caja-chica/caja-chica.controller.ts
import {
    Controller,
    Get,
    Post,
    Patch,
    Param,
    Body,
    Req,
    ParseIntPipe,
    Query,
    HttpException,
    HttpStatus,
    BadRequestException,
} from '@nestjs/common';
import { CajaChicaService } from './caja-chica.service';
import { CreateCajaChicaDto } from './dto/create-caja-chica.dto';
import { CancelCuadreDto } from './dto/cancel-cuadre.dto';

@Controller('caja-chica')
export class CajaChicaController {
    constructor(private readonly cajaChicaService: CajaChicaService) { }

    // ════════════════════════════════════════════════════════════════
    // HELPER: Manejo de errores estructurado
    // ════════════════════════════════════════════════════════════════
    private handleError(error: any, defaultMessage: string) {
        console.error(`❌ ${defaultMessage}:`, {
            message: error.message,
            stack: error.stack?.split('\n').slice(0, 3).join('\n'),
        });

        let errorMessage = error.message;
        let errorCode = 'CAJA_CHICA_ERROR';
        let statusCode = HttpStatus.BAD_REQUEST;

        if (error instanceof HttpException) {
            const response = error.getResponse();
            statusCode = error.getStatus();

            if (typeof response === 'string') {
                errorMessage = response;
            } else if (typeof response === 'object' && response !== null) {
                errorMessage = (response as any).message || error.message;
            }

            // Determinar código de error según el mensaje
            if (errorMessage.includes('no encontrad') || errorMessage.includes('not found')) {
                errorCode = 'NOT_FOUND';
            } else if (errorMessage.includes('PENDIENTE')) {
                errorCode = 'CORTES_PENDIENTES';
            } else if (errorMessage.includes('movimientos sin corte')) {
                errorCode = 'USUARIOS_SIN_CORTE';
            } else if (errorMessage.includes('ya existe un cuadre')) {
                errorCode = 'CUADRE_DUPLICADO';
            } else if (errorMessage.includes('sucursal')) {
                errorCode = 'SIN_SUCURSAL';
            } else if (errorMessage.includes('obligatori')) {
                errorCode = 'CAMPO_REQUERIDO';
            } else if (errorMessage.includes('negativ')) {
                errorCode = 'MONTO_NEGATIVO';
            } else if (errorMessage.includes('diferencia')) {
                errorCode = 'DIFERENCIA_SIN_OBSERVACION';
            } else if (errorMessage.includes('Caja General')) {
                errorCode = 'BLOQUEADO_POR_CAJA_GENERAL';
            } else if (errorMessage.includes('código') || errorMessage.includes('autorización')) {
                errorCode = 'CODIGO_INVALIDO';
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

    // ════════════════════════════════════════════════════════════════
    // ENDPOINTS
    // ════════════════════════════════════════════════════════════════

    // Precuadre del día (resumen para UI)
    @Get('precuadre/:sucursalId')
    async precuadre(@Param('sucursalId') sucursalId: string) {
        try {
            console.log('📥 GET /caja-chica/precuadre - SucursalID:', sucursalId);
            return this.cajaChicaService.precuadre(Number(sucursalId));
        } catch (error) {
            this.handleError(error, 'Error al obtener precuadre de caja chica');
        }
    }

    // Cuadrar caja chica
    @Post('cuadrar/:usuarioID/:sucursalId')
    async cuadrar(
        @Param('usuarioID', ParseIntPipe) usuarioID: number,
        @Param('sucursalId', ParseIntPipe) sucursalId: number,
        @Req() req,
        @Body() dto: CreateCajaChicaDto,
    ) {
        try {
            console.log('📥 POST /caja-chica/cuadrar - UsuarioID:', usuarioID, 'SucursalID:', sucursalId);
            console.log('   Body:', JSON.stringify(dto, null, 2));
            return this.cajaChicaService.cuadrarCajaChica(usuarioID, sucursalId, dto);
        } catch (error) {
            this.handleError(error, 'Error al cuadrar caja chica');
        }
    }

    // Historial
    @Get('historial')
    async historial() {
        try {
            return this.cajaChicaService.historial();
        } catch (error) {
            this.handleError(error, 'Error al obtener historial de caja chica');
        }
    }

    // Generar código de autorización para cancelar un cuadre específico
    @Get(':id/codigo')
    async generarCodigo(@Param('id', ParseIntPipe) id: number) {
        try {
            console.log('📥 GET /caja-chica/:id/codigo - ID:', id);
            return this.cajaChicaService.generarCodigoAutorizacion(id);
        } catch (error) {
            this.handleError(error, 'Error al generar código de autorización');
        }
    }

    // Cancelar un cuadre con código de autorización
    @Patch(':id/cancelar')
    async cancelar(
        @Param('id', ParseIntPipe) id: number,
        @Body() body: CancelCuadreDto
    ) {
        try {
            console.log('📥 PATCH /caja-chica/:id/cancelar - ID:', id);
            const { usuario, codigo, motivo } = body;

            if (!usuario) {
                throw new BadRequestException('El usuario es obligatorio');
            }
            if (!codigo) {
                throw new BadRequestException('El código de autorización es obligatorio');
            }
            if (!motivo || motivo.trim().length === 0) {
                throw new BadRequestException('El motivo de cancelación es obligatorio');
            }

            return this.cajaChicaService.cancelarCuadre(id, usuario, codigo, motivo);
        } catch (error) {
            this.handleError(error, 'Error al cancelar cuadre de caja chica');
        }
    }

    // Listar por estatus (filtros opcionales de fecha)
    @Get('estatus/:estatus')
    async listarPorEstatus(
        @Param('estatus') estatus: 'Pendiente' | 'Cerrado' | 'Cancelado',
        @Query('desde') desde?: string,
        @Query('hasta') hasta?: string,
    ) {
        try {
            return this.cajaChicaService.listarPorEstatus(estatus, { desde, hasta });
        } catch (error) {
            this.handleError(error, 'Error al listar cuadres por estatus');
        }
    }

    // Actualizar capturables/observaciones (si NO está Cerrado)
    @Patch(':id/capturables')
    async actualizarCapturables(
        @Param('id') id: number,
        @Body()
        body: {
            Observaciones?: string | null;
            SaldoReal?: number;
            TotalEfectivoCapturado?: number;
            TotalTarjetaCapturado?: number;
            TotalTransferenciaCapturado?: number;
            usuarioEdicion?: string;
        },
    ) {
        try {
            console.log('📥 PATCH /caja-chica/:id/capturables - ID:', id);

            // Validar montos no negativos
            if (body.SaldoReal !== undefined && body.SaldoReal < 0) {
                throw new BadRequestException('El saldo real no puede ser negativo');
            }
            if (body.TotalEfectivoCapturado !== undefined && body.TotalEfectivoCapturado < 0) {
                throw new BadRequestException('El efectivo capturado no puede ser negativo');
            }
            if (body.TotalTarjetaCapturado !== undefined && body.TotalTarjetaCapturado < 0) {
                throw new BadRequestException('La tarjeta capturada no puede ser negativa');
            }
            if (body.TotalTransferenciaCapturado !== undefined && body.TotalTransferenciaCapturado < 0) {
                throw new BadRequestException('La transferencia capturada no puede ser negativa');
            }

            const usuarioEdicion = body.usuarioEdicion || 'sistema';
            return this.cajaChicaService.actualizarCapturables(id, body, usuarioEdicion);
        } catch (error) {
            this.handleError(error, 'Error al actualizar capturables');
        }
    }
}
