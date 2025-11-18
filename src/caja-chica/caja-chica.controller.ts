// src/caja-chica/caja-chica.controller.ts
import { Controller, Get, Post, Patch, Param, Body, Req, ParseIntPipe, Query } from '@nestjs/common';
import { CajaChicaService } from './caja-chica.service';
import { CreateCajaChicaDto } from './dto/create-caja-chica.dto';
import { CancelCuadreDto } from './dto/cancel-cuadre.dto';


@Controller('caja-chica')
export class CajaChicaController {
    constructor(private readonly cajaChicaService: CajaChicaService) { }

    // Precuadre del día (resumen para UI)
    // caja-chica.controller.ts
    @Get('precuadre/:sucursalId')
    precuadre(@Param('sucursalId') sucursalId: string) {
        return this.cajaChicaService.precuadre(Number(sucursalId));
    }


    // Cuadrar caja chica (usa el usuario autenticado; fallback a 1)
    @Post('cuadrar/:sucursalId')
    cuadrar(
        @Param('sucursalId', ParseIntPipe) sucursalId: number,
        @Req() req,
        @Body() dto: CreateCajaChicaDto,
    ) {
        const usuarioID = req.user.UsuarioID;
        return this.cajaChicaService.cuadrarCajaChica(usuarioID, sucursalId, dto);
    }



    // Historial
    @Get('historial')
    async historial() {
        return this.cajaChicaService.historial();
    }

    // Generar código de autorización para cancelar un cuadre específico
    @Get(':id/codigo')
    async generarCodigo(@Param('id', ParseIntPipe) id: number) {
        return this.cajaChicaService.generarCodigoAutorizacion(id);
    }

    // Cancelar un cuadre con código de autorización
    @Patch(':id/cancelar')
    async cancelar(
        @Param('id', ParseIntPipe) id: number,
        @Body() body: CancelCuadreDto
    ) {
        const { usuario, codigo, motivo } = body;
        return this.cajaChicaService.cancelarCuadre(id, usuario, codigo, motivo);
    }

    // 🔎 Listar por estatus (filtros opcionales de fecha)
    // GET /caja-chica/estatus/Cerrado?desde=2025-11-01&hasta=2025-11-30
    @Get('estatus/:estatus')
    async listarPorEstatus(
        @Param('estatus') estatus: 'Pendiente' | 'Cerrado' | 'Cancelado',
        @Query('desde') desde?: string,
        @Query('hasta') hasta?: string,
    ) {
        return this.cajaChicaService.listarPorEstatus(estatus, { desde, hasta });
    }

    // ✏️ PATCH capturables/observaciones (si NO está Cerrado)
    // PATCH /caja-chica/123/capturables
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
        },
    ) {
        // ⚠️ Aquí podrías tomar el usuario autenticado; por ahora ejemplo fijo
        const usuarioEdicion = 'sistema';
        return this.cajaChicaService.actualizarCapturables(id, body, usuarioEdicion);
    }
}
