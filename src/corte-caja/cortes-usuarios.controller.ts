// src/corte-caja/cortes-usuarios.controller.ts
import {
    Controller,
    Get,
    Post,
    Param,
    Body,
    Patch,
    HttpException,
    HttpStatus,
    ParseIntPipe,
    BadRequestException,
} from '@nestjs/common';
import { CortesUsuariosService } from './cortes-usuarios.service';
import {
    CreateCorteUsuarioDto,
    GenerateCorteUsuarioDto,
    UpdateCorteUsuarioDto,
    CancelCorteUsuarioDto,
} from './dto/cortes-usuarios.dto';
import { CortesUsuarios } from './entities/cortes-usuarios.entity';

@Controller('cortes-usuarios')
export class CortesUsuariosController {
    constructor(private readonly cortesUsuariosService: CortesUsuariosService) { }

    // ════════════════════════════════════════════════════════════════
    // HELPER: Manejo de errores estructurado
    // ════════════════════════════════════════════════════════════════
    private handleError(error: any, defaultMessage: string) {
        console.error(`❌ ${defaultMessage}:`, {
            message: error.message,
            stack: error.stack?.split('\n').slice(0, 3).join('\n'),
        });

        let errorMessage = error.message;
        let errorCode = 'CORTE_USUARIO_ERROR';
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
            if (errorMessage.includes('no encontrad') || errorMessage.includes('not found') || errorMessage.includes('No hay')) {
                errorCode = 'NOT_FOUND';
            } else if (errorMessage.includes('ya existe') || errorMessage.includes('ya tiene')) {
                errorCode = 'CORTE_DUPLICADO';
            } else if (errorMessage.includes('Caja Chica')) {
                errorCode = 'BLOQUEADO_POR_CAJA_CHICA';
            } else if (errorMessage.includes('obligatori') || errorMessage.includes('requerido')) {
                errorCode = 'CAMPO_REQUERIDO';
            } else if (errorMessage.includes('negativ')) {
                errorCode = 'MONTO_NEGATIVO';
            } else if (errorMessage.includes('diferencia')) {
                errorCode = 'DIFERENCIA_SIN_OBSERVACION';
            } else if (errorMessage.includes('código') || errorMessage.includes('autorización')) {
                errorCode = 'CODIGO_INVALIDO';
            } else if (errorMessage.includes('Cancelado') || errorMessage.includes('cancelado')) {
                errorCode = 'CORTE_CANCELADO';
            } else if (errorMessage.includes('vacío')) {
                errorCode = 'BODY_VACIO';
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

    @Get('generar/:usuarioID')
    async generarCorte(
        @Param('usuarioID') usuarioID: number,
    ): Promise<GenerateCorteUsuarioDto | any> {
        try {
            console.log('📥 GET /cortes-usuarios/generar/:usuarioID - UsuarioID:', usuarioID);
            const result = await this.cortesUsuariosService.generarCorteCaja(usuarioID);
            return {
                success: true,
                data: result,
            };
        } catch (error) {
            this.handleError(error, 'Error al generar corte de caja');
        }
    }

    @Get('del-dia')
    async getCortesDelDia(): Promise<CortesUsuarios[] | any> {
        try {
            const result = await this.cortesUsuariosService.getCortesDelDia();
            return {
                success: true,
                data: result,
            };
        } catch (error) {
            this.handleError(error, 'Error al obtener cortes del día');
        }
    }

    @Get()
    async getAllCortes() {
        try {
            const result = await this.cortesUsuariosService.getAllCortes();
            return {
                success: true,
                data: result,
            };
        } catch (error) {
            this.handleError(error, 'Error al obtener todos los cortes');
        }
    }

    @Get('usuario/:usuarioID')
    async getCortesByUsuario(@Param('usuarioID') usuarioID: number) {
        try {
            console.log('📥 GET /cortes-usuarios/usuario/:usuarioID - UsuarioID:', usuarioID);
            const result = await this.cortesUsuariosService.getCortesByUsuario(usuarioID);
            return {
                success: true,
                data: result,
            };
        } catch (error) {
            this.handleError(error, 'Error al obtener cortes por usuario');
        }
    }

    @Get('usuarios-sin-corte-hoy')
    async getUsuariosSinCorteHoy() {
        try {
            const result = await this.cortesUsuariosService.getUsuariosSinCorteHoy();
            return {
                success: true,
                data: result,
            };
        } catch (error) {
            this.handleError(error, 'Error al obtener usuarios sin corte hoy');
        }
    }

    @Get('cancelados/:usuarioID')
    async getCorteCanceladoByUser(
        @Param('usuarioID') usuarioID: number,
    ): Promise<CortesUsuarios[] | any> {
        try {
            console.log('📥 GET /cortes-usuarios/cancelados/:usuarioID - UsuarioID:', usuarioID);
            const result = await this.cortesUsuariosService.getCorteCanceladoByUser(usuarioID);
            return {
                success: true,
                data: result,
            };
        } catch (error) {
            this.handleError(error, 'Error al obtener cortes cancelados');
        }
    }

    @Get('cerrados/:usuarioID')
    async getCorteCerradoByUser(
        @Param('usuarioID') usuarioID: number,
    ): Promise<CortesUsuarios[] | any> {
        try {
            console.log('📥 GET /cortes-usuarios/cerrados/:usuarioID - UsuarioID:', usuarioID);
            const result = await this.cortesUsuariosService.getCorteCerradoByUser(usuarioID);
            return {
                success: true,
                data: result,
            };
        } catch (error) {
            this.handleError(error, 'Error al obtener cortes cerrados');
        }
    }

    @Get('cerrado-hoy/:usuarioID')
    async getCorteCerradoByUserByDay(
        @Param('usuarioID') usuarioID: number,
    ): Promise<CortesUsuarios | any> {
        try {
            console.log('📥 GET /cortes-usuarios/cerrado-hoy/:usuarioID - UsuarioID:', usuarioID);
            const corte = await this.cortesUsuariosService.getCorteCerradoByUserByDay(usuarioID);
            if (!corte) {
                throw new HttpException(
                    'No hay un corte de caja cerrado para este usuario en el día actual',
                    HttpStatus.NOT_FOUND,
                );
            }
            return {
                success: true,
                data: corte,
            };
        } catch (error) {
            this.handleError(error, 'Error al obtener corte cerrado del día');
        }
    }

    @Get(':corteID')
    async getCorteById(@Param('corteID') corteID: number) {
        try {
            console.log('📥 GET /cortes-usuarios/:corteID - CorteID:', corteID);
            const result = await this.cortesUsuariosService.getCorteConHistorialById(corteID);
            return {
                success: true,
                data: result,
            };
        } catch (error) {
            this.handleError(error, 'Error al obtener corte por ID');
        }
    }

    @Patch(':corteID/:usuarioEdicion')
    async updateCorte(
        @Param('corteID') corteID: number,
        @Param('usuarioEdicion') usuarioEdicion: string,
        @Body() updateDto: UpdateCorteUsuarioDto,
    ) {
        try {
            console.log('📥 PATCH /cortes-usuarios/:corteID/:usuarioEdicion - CorteID:', corteID, 'Usuario:', usuarioEdicion);

            if (!updateDto || Object.keys(updateDto).length === 0) {
                throw new BadRequestException('El cuerpo de la solicitud no puede estar vacío');
            }

            if (!usuarioEdicion) {
                throw new BadRequestException('El usuario que realiza la edición es obligatorio');
            }

            const result = await this.cortesUsuariosService.updateCorte(
                corteID,
                updateDto,
                usuarioEdicion,
            );
            return {
                success: true,
                message: 'Corte actualizado exitosamente',
                data: result,
            };
        } catch (error) {
            this.handleError(error, 'Error al actualizar corte');
        }
    }

    @Post('guardar')
    async guardarCorte(
        @Body() corteDto: CreateCorteUsuarioDto,
    ): Promise<CortesUsuarios | any> {
        try {
            console.log('📥 POST /cortes-usuarios/guardar');
            console.log('   Body:', JSON.stringify(corteDto, null, 2));

            if (!corteDto.usuarioID) {
                throw new BadRequestException('usuarioID es requerido');
            }

            // Validar montos no negativos
            if (corteDto.SaldoReal !== undefined && corteDto.SaldoReal < 0) {
                throw new BadRequestException('El saldo real no puede ser negativo');
            }
            if (corteDto.TotalEfectivoCapturado !== undefined && corteDto.TotalEfectivoCapturado < 0) {
                throw new BadRequestException('El efectivo capturado no puede ser negativo');
            }

            const result = await this.cortesUsuariosService.guardarCorteCaja(
                corteDto.usuarioID,
                corteDto.SaldoReal,
                corteDto.TotalEfectivoCapturado,
                corteDto.TotalTarjetaCapturado,
                corteDto.TotalTransferenciaCapturado,
                corteDto.Observaciones,
                corteDto.usuarioCreadorID,
            );
            return {
                success: true,
                message: 'Corte de caja guardado exitosamente',
                data: result,
            };
        } catch (error) {
            this.handleError(error, 'Error al guardar corte de caja');
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // ENDPOINTS PARA CANCELACIÓN DE CORTES
    // ═══════════════════════════════════════════════════════════════

    @Get(':id/codigo')
    async generarCodigoAutorizacion(@Param('id', ParseIntPipe) id: number) {
        try {
            console.log('📥 GET /cortes-usuarios/:id/codigo - ID:', id);
            const result = await this.cortesUsuariosService.generarCodigoAutorizacion(id);
            return {
                success: true,
                data: result,
            };
        } catch (error) {
            this.handleError(error, 'Error al generar código de autorización');
        }
    }

    @Post(':id/cancelar')
    async cancelarCorte(
        @Param('id', ParseIntPipe) id: number,
        @Body() body: CancelCorteUsuarioDto,
    ) {
        try {
            console.log('📥 POST /cortes-usuarios/:id/cancelar - ID:', id);
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

            const result = await this.cortesUsuariosService.cancelarCorte(id, usuario, codigo, motivo);
            return {
                success: true,
                message: 'Corte de usuario cancelado exitosamente',
                data: result,
            };
        } catch (error) {
            this.handleError(error, 'Error al cancelar corte de usuario');
        }
    }
}
