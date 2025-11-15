import { Controller, Get, Post, Query, Body } from '@nestjs/common';
import { CajaGeneralService } from './caja-general.service';
import { GetCajaGeneralDashboardDto } from './dto/get-caja-general-dashboard.dto';
import { CuadrarCajaGeneralDto } from './dto/cuadrar-caja-general.dto';
import { CajaGeneralDashboardResponseDto } from './dto/caja-general-dashboard-response.dto';
import { CajaGeneral } from './entities/caja-general.entity';
import { CreateMovimientoCajaGeneralDto, GetMovimientosCajaGeneralDto } from './dto/reate-movimiento-caja-general.dto';

@Controller('caja-general')
export class CajaGeneralController {
    constructor(private readonly cajaGeneralService: CajaGeneralService) { }

    @Get('dashboard')
    async getDashboard(
        @Query('fecha') fecha: string,
        @Query('sucursalId') sucursalId?: string,
    ): Promise<CajaGeneralDashboardResponseDto> {
        const dto: GetCajaGeneralDashboardDto = {
            fecha,
            sucursalId: sucursalId ? Number(sucursalId) : undefined,
        };
        return this.cajaGeneralService.getDashboard(dto);
    }

    @Get('pre-cuadre')
    async getPreCuadre(
        @Query('fecha') fecha: string,
        @Query('sucursalId') sucursalId?: string,
    ) {
        const dto: GetCajaGeneralDashboardDto = {
            fecha,
            sucursalId: sucursalId ? Number(sucursalId) : undefined,
        };
        return this.cajaGeneralService.getPreCuadre(dto);
    }


    @Post('cuadrar')
    async cuadrarCajaGeneral(
        @Body() body: CuadrarCajaGeneralDto,
    ): Promise<CajaGeneral> {
        return this.cajaGeneralService.cuadrarCajaGeneral(body);
    }

    // 🔹 NUEVO: crear movimientos de Caja General
    @Post('movimientos')
    async crearMovimientoCajaGeneral(
        @Body() body: CreateMovimientoCajaGeneralDto,
    ) {
        return this.cajaGeneralService.crearMovimientoCajaGeneral(body);
    }

    // 🔹 NUEVO: listar movimientos de Caja General
    @Get('movimientos')
    async listarMovimientosCajaGeneral(
        @Query() query: GetMovimientosCajaGeneralDto,
    ) {
        return this.cajaGeneralService.listarMovimientosCajaGeneral(query);
    }
}
