// src/caja-general/caja-general.controller.ts
import {
    Controller,
    Get,
    Post,
    Patch,
    Query,
    Body,
    Param,
    ParseIntPipe,
    HttpException,
    HttpStatus,
    BadRequestException,
} from '@nestjs/common';
import { CajaGeneralService } from './caja-general.service';
import { GetCajaGeneralDashboardDto } from './dto/get-caja-general-dashboard.dto';
import { CuadrarCajaGeneralDto } from './dto/cuadrar-caja-general.dto';
import { CajaGeneralDashboardResponseDto } from './dto/caja-general-dashboard-response.dto';
import { CreateMovimientoCajaGeneralDto, GetMovimientosCajaGeneralDto } from './dto/reate-movimiento-caja-general.dto';
import { CancelCajaGeneralDto } from './dto/cancel-caja-general.dto';

@Controller('caja-general')
export class CajaGeneralController {
    constructor(private readonly cajaGeneralService: CajaGeneralService) { }

    // ════════════════════════════════════════════════════════════════
    // HELPER: Manejo de errores estructurado
    // ════════════════════════════════════════════════════════════════
    private handleError(error: any, defaultMessage: string) {
        console.error(`❌ ${defaultMessage}:`, {
            message: error.message,
            stack: error.stack?.split('\n').slice(0, 3).join('\n'),
        });

        let errorMessage = error.message;
        let errorCode = 'CAJA_GENERAL_ERROR';
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
            } else if (errorMessage.includes('PENDIENTE') || errorMessage.includes('pendiente')) {
                errorCode = 'CAJAS_PENDIENTES';
            } else if (errorMessage.includes('sin cuadrar') || errorMessage.includes('sin cerrar')) {
                errorCode = 'CAJAS_SIN_CERRAR';
            } else if (errorMessage.includes('ya existe un cuadre')) {
                errorCode = 'CUADRE_DUPLICADO';
            } else if (errorMessage.includes('obligatori')) {
                errorCode = 'CAMPO_REQUERIDO';
            } else if (errorMessage.includes('negativ')) {
                errorCode = 'MONTO_NEGATIVO';
            } else if (errorMessage.includes('diferencia')) {
                errorCode = 'DIFERENCIA_SIN_OBSERVACION';
            } else if (errorMessage.includes('código') || errorMessage.includes('autorización')) {
                errorCode = 'CODIGO_INVALIDO';
            } else if (errorMessage.includes('Cancelado')) {
                errorCode = 'CUADRE_CANCELADO';
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

    @Get('dashboard')
    async getDashboard(
        @Query('fecha') fecha: string,
        @Query('sucursalId') sucursalId?: string,
    ): Promise<CajaGeneralDashboardResponseDto | any> {
        try {
            console.log('📥 GET /caja-general/dashboard - Fecha:', fecha, 'SucursalID:', sucursalId);
            const dto: GetCajaGeneralDashboardDto = {
                fecha,
                sucursalId: sucursalId ? Number(sucursalId) : undefined,
            };
            return this.cajaGeneralService.getDashboard(dto);
        } catch (error) {
            this.handleError(error, 'Error al obtener dashboard de caja general');
        }
    }

    @Get('pre-cuadre')
    async getPreCuadre(
        @Query('fecha') fecha: string,
        @Query('sucursalId') sucursalId?: string,
    ) {
        try {
            console.log('📥 GET /caja-general/pre-cuadre - Fecha:', fecha, 'SucursalID:', sucursalId);
            const dto: GetCajaGeneralDashboardDto = {
                fecha,
                sucursalId: sucursalId ? Number(sucursalId) : undefined,
            };
            return this.cajaGeneralService.getPreCuadre(dto);
        } catch (error) {
            this.handleError(error, 'Error al obtener pre-cuadre de caja general');
        }
    }

    @Post('cuadrar')
    async cuadrarCajaGeneral(
        @Body() body: CuadrarCajaGeneralDto,
    ) {
        try {
            console.log('📥 POST /caja-general/cuadrar');
            console.log('   Body:', JSON.stringify(body, null, 2));

            // Validaciones básicas
            if (!body.fecha) {
                throw new BadRequestException('La fecha es obligatoria');
            }
            if (!body.usuarioCuadreId) {
                throw new BadRequestException('El usuario de cuadre es obligatorio');
            }

            // Validar montos no negativos
            if (body.totalEfectivoCapturado !== undefined && body.totalEfectivoCapturado < 0) {
                throw new BadRequestException('El efectivo capturado no puede ser negativo');
            }
            if (body.saldoReal !== undefined && body.saldoReal < 0) {
                throw new BadRequestException('El saldo real no puede ser negativo');
            }

            return this.cajaGeneralService.cuadrarCajaGeneral(body);
        } catch (error) {
            this.handleError(error, 'Error al cuadrar caja general');
        }
    }

    @Post('movimientos')
    async crearMovimientoCajaGeneral(
        @Body() body: CreateMovimientoCajaGeneralDto,
    ) {
        try {
            console.log('📥 POST /caja-general/movimientos');
            return this.cajaGeneralService.crearMovimientoCajaGeneral(body);
        } catch (error) {
            this.handleError(error, 'Error al crear movimiento de caja general');
        }
    }

    @Get('movimientos')
    async listarMovimientosCajaGeneral(
        @Query() query: GetMovimientosCajaGeneralDto,
    ) {
        try {
            return this.cajaGeneralService.listarMovimientosCajaGeneral(query);
        } catch (error) {
            this.handleError(error, 'Error al listar movimientos de caja general');
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // ENDPOINTS PARA CANCELACIÓN DE CUADRES
    // ═══════════════════════════════════════════════════════════════

    @Get(':id/codigo')
    async generarCodigoAutorizacion(@Param('id', ParseIntPipe) id: number) {
        try {
            console.log('📥 GET /caja-general/:id/codigo - ID:', id);
            return this.cajaGeneralService.generarCodigoAutorizacion(id);
        } catch (error) {
            this.handleError(error, 'Error al generar código de autorización');
        }
    }

    @Patch(':id/cancelar')
    async cancelarCuadre(
        @Param('id', ParseIntPipe) id: number,
        @Body() body: CancelCajaGeneralDto,
    ) {
        try {
            console.log('📥 PATCH /caja-general/:id/cancelar - ID:', id);
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

            return this.cajaGeneralService.cancelarCuadre(id, usuario, codigo, motivo);
        } catch (error) {
            this.handleError(error, 'Error al cancelar cuadre de caja general');
        }
    }
}
