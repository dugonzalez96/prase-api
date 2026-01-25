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
  BadRequestException,
} from '@nestjs/common';
import { IniciosCajaService } from './inicios-caja.service';
import { CreateInicioCajaDto } from './dto/create-inicio-caja.dto';
import { UpdateInicioCajaDto } from './dto/update-inicio-caja.dto';

@Controller('inicios-caja')
export class IniciosCajaController {
  constructor(private readonly iniciosCajaService: IniciosCajaService) {}

  @Get()
  findAll() {
    return this.iniciosCajaService.findAll();
  }

  @Get('activo/:usuarioID')
  findActive(@Param('usuarioID') usuarioID: number) {
    return this.iniciosCajaService.findActive(usuarioID);
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.iniciosCajaService.findOne(id);
  }

  @Post()
  async create(@Body() createDto: CreateInicioCajaDto) {
    try {
      console.log('📥 POST /inicios-caja - Body recibido:', JSON.stringify(createDto, null, 2));
      const result = await this.iniciosCajaService.create(createDto);
      console.log('✅ Inicio de caja creado exitosamente:', result.InicioCajaID);
      return {
        success: true,
        message: 'Inicio de caja creado exitosamente',
        data: result,
      };
    } catch (error) {
      console.error('❌ Error al crear inicio de caja:', {
        message: error.message,
        stack: error.stack,
        dto: JSON.stringify(createDto),
      });

      // Extraer el mensaje del error
      let errorMessage = error.message;
      let errorCode = 'INICIO_CAJA_ERROR';
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
        } else if (errorMessage.includes('ya tiene un inicio de caja activo')) {
          errorCode = 'INICIO_CAJA_DUPLICADO';
        } else if (errorMessage.includes('sucursal')) {
          errorCode = 'SIN_SUCURSAL';
        } else if (errorMessage.includes('obligatorio')) {
          errorCode = 'CAMPO_REQUERIDO';
        } else if (statusCode === HttpStatus.CONFLICT) {
          errorCode = 'CONFLICTO';
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

  @Patch(':id')
  update(@Param('id') id: number, @Body() updateDto: UpdateInicioCajaDto) {
    return this.iniciosCajaService.update(id, updateDto);
  }

  @Delete(':id/:usuarioID')
  remove(
    @Param('id') id: number,
    @Param('usuarioID') usuarioID: number,
    @Body('motivo') motivo: string,
  ): Promise<string> {
    if (!motivo) {
      throw new HttpException(
        'El motivo de la eliminación es obligatorio',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.iniciosCajaService.remove(id, usuarioID, motivo);
  }
  
}
