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
  constructor(private readonly cortesUsuariosService: CortesUsuariosService) {}

  @Get('generar/:usuarioID')
  async generarCorte(
    @Param('usuarioID') usuarioID: number,
  ): Promise<GenerateCorteUsuarioDto> {
    return this.cortesUsuariosService.generarCorteCaja(usuarioID);
  }

  @Get('del-dia')
  async getCortesDelDia(): Promise<CortesUsuarios[]> {
    return this.cortesUsuariosService.getCortesDelDia();
  }

  // ✅ 1️⃣ Obtener todos los cortes de caja
  @Get()
  async getAllCortes() {
    return await this.cortesUsuariosService.getAllCortes();
  }

  // ✅ 3️⃣ Obtener cortes de caja por ID de usuario
  @Get('usuario/:usuarioID')
  async getCortesByUsuario(@Param('usuarioID') usuarioID: number) {
    return await this.cortesUsuariosService.getCortesByUsuario(usuarioID);
  }

  @Get('usuarios-sin-corte-hoy')
  async getUsuariosSinCorteHoy() {
    return this.cortesUsuariosService.getUsuariosSinCorteHoy();
  }

  /**
   * 🔹 Obtener cortes de caja "Cancelados" por usuario
   */
  @Get('cancelados/:usuarioID')
  async getCorteCanceladoByUser(
    @Param('usuarioID') usuarioID: number,
  ): Promise<CortesUsuarios[]> {
    return this.cortesUsuariosService.getCorteCanceladoByUser(usuarioID);
  }

  /**
   * 🔹 Obtener cortes de caja "Cerrados" por usuario
   */
  @Get('cerrados/:usuarioID')
  async getCorteCerradoByUser(
    @Param('usuarioID') usuarioID: number,
  ): Promise<CortesUsuarios[]> {
    return this.cortesUsuariosService.getCorteCerradoByUser(usuarioID);
  }

  /**
   * 🔹 Obtener el corte de caja "Cerrado" del día para un usuario
   */
  @Get('cerrado-hoy/:usuarioID')
  async getCorteCerradoByUserByDay(
    @Param('usuarioID') usuarioID: number,
  ): Promise<CortesUsuarios | null> {
    const corte =
      await this.cortesUsuariosService.getCorteCerradoByUserByDay(usuarioID);
    if (!corte) {
      throw new HttpException(
        'No hay un corte de caja cerrado para este usuario en el día actual',
        HttpStatus.NOT_FOUND,
      );
    }
    return corte;
  }

  // ✅ 2️⃣ Obtener un corte de caja por su ID
  @Get(':corteID')
  async getCorteById(@Param('corteID') corteID: number) {
    return await this.cortesUsuariosService.getCorteConHistorialById(corteID);
  }

  // ✅ 4️⃣ Actualizar datos de un corte de caja
  @Patch(':corteID/:usuarioEdicion')
  async updateCorte(
    @Param('corteID') corteID: number,
    @Param('usuarioEdicion') usuarioEdicion: string, // Se recibe en la URL
    @Body() updateDto: UpdateCorteUsuarioDto,
  ) {
    if (!updateDto || Object.keys(updateDto).length === 0) {
      throw new HttpException(
        'El cuerpo de la solicitud no puede estar vacío',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!usuarioEdicion) {
      throw new HttpException(
        'El usuario que realiza la edición es obligatorio',
        HttpStatus.BAD_REQUEST,
      );
    }

    return await this.cortesUsuariosService.updateCorte(
      corteID,
      updateDto,
      usuarioEdicion,
    );
  }

  @Post('guardar')
  async guardarCorte(
    @Body() corteDto: CreateCorteUsuarioDto,
  ): Promise<CortesUsuarios> {
    console.log('📥 Request Body:', corteDto);

    if (!corteDto.usuarioID) {
      throw new HttpException(
        '⚠️ usuarioID es requerido',
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.cortesUsuariosService.guardarCorteCaja(
      corteDto.usuarioID,
      corteDto.SaldoReal,
      corteDto.TotalEfectivoCapturado,
      corteDto.TotalTarjetaCapturado,
      corteDto.TotalTransferenciaCapturado,
      corteDto.Observaciones,
      corteDto.usuarioCreadorID, // Usuario que realiza el corte
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // 🔐 ENDPOINTS PARA CANCELACIÓN DE CORTES
  // ═══════════════════════════════════════════════════════════════

  /**
   * 🔹 Generar código de autorización para cancelar un corte
   * GET /cortes-usuarios/:id/codigo
   */
  @Get(':id/codigo')
  async generarCodigoAutorizacion(@Param('id', ParseIntPipe) id: number) {
    return this.cortesUsuariosService.generarCodigoAutorizacion(id);
  }

  /**
   * 🔹 Cancelar un corte de usuario
   * POST /cortes-usuarios/:id/cancelar
   *
   * Requiere código de autorización previamente generado
   * No se puede cancelar si el corte ya está incluido en un cuadre de caja chica
   */
  @Post(':id/cancelar')
  async cancelarCorte(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: CancelCorteUsuarioDto,
  ) {
    const { usuario, codigo, motivo } = body;

    if (!usuario) {
      throw new HttpException(
        'El usuario es obligatorio',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!codigo) {
      throw new HttpException(
        'El código de autorización es obligatorio',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!motivo || motivo.trim().length === 0) {
      throw new HttpException(
        'El motivo de cancelación es obligatorio',
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.cortesUsuariosService.cancelarCorte(id, usuario, codigo, motivo);
  }
}
