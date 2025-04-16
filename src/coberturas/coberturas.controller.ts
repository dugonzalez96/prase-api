import { Controller, Get, Post, Put, Delete, Param, Body, HttpException, HttpStatus, Patch } from '@nestjs/common';
import { CoberturasService } from './coberturas.service';
import { Coberturas } from './coberturas.entity';

@Controller('coberturas')
export class CoberturasController {
  constructor(private readonly coberturasService: CoberturasService) {}

  // Obtener todas las coberturas
  @Get()
  findAll(): Promise<Coberturas[]> {
    return this.coberturasService.findAll();
  }

  // Obtener una cobertura por ID
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Coberturas> {
    const cobertura = await this.coberturasService.findOne(Number(id));
    if (!cobertura) {
      throw new HttpException('Cobertura not found', HttpStatus.NOT_FOUND);
    }
    return cobertura;
  }

  // Crear una nueva cobertura
  @Post()
  async create(@Body() cobertura: Partial<Coberturas>): Promise<Coberturas> {
    try {
      return await this.coberturasService.create(cobertura);
    } catch (error) {
      console.error(error)
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }

  // Actualizar parcialmente una cobertura existente
  @Patch(':id/:usuario')
  async updatePartial(
    @Param('id') id: string,
    @Param('usuario') usuario: string,
    @Body() cobertura: Partial<Coberturas>,
  ): Promise<Coberturas> {
    try {
      return await this.coberturasService.update(Number(id), cobertura, usuario);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Error updating cobertura', HttpStatus.BAD_REQUEST);
    }
  }

  // Eliminar una cobertura por ID (actualiza el estado de la cobertura a RECHAZADA)
  @Delete(':id/:usuario')
  async remove(
    @Param('id') id: string,
    @Param('usuario') usuario: string,
    @Body('motivo') motivo?: string,
  ): Promise<{ message: string }> {
    try {
      await this.coberturasService.remove(Number(id), usuario, motivo);
      return { message: `Cobertura con ID ${id} ha sido rechazada exitosamente` };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Error removing cobertura', HttpStatus.BAD_REQUEST);
    }
  }
}
