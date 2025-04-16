import { Controller, Get, Post, Put, Delete, Param, Body, HttpException, HttpStatus, Patch } from '@nestjs/common';
import { PaqueteCoberturasService } from './paquete-coberturas.service';
import { PaqueteCoberturas } from './paquete-coberturas.entity';

@Controller('paquete-coberturas')
export class PaqueteCoberturasController {
  constructor(private readonly paqueteCoberturasService: PaqueteCoberturasService) { }

  // Obtener todos los registros de PaqueteCoberturas
  @Get()
  findAll(): Promise<PaqueteCoberturas[]> {
    return this.paqueteCoberturasService.findAll();
  }

  // Obtener un solo PaqueteCoberturas por ID
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<PaqueteCoberturas> {
    const paquete = await this.paqueteCoberturasService.findOne(Number(id));
    if (!paquete) {
      throw new HttpException('PaqueteCoberturas not found', HttpStatus.NOT_FOUND);
    }
    return paquete;
  }

  // Crear un nuevo PaqueteCoberturas
  @Post()
  create(@Body() paquete: PaqueteCoberturas): Promise<PaqueteCoberturas> {
    return this.paqueteCoberturasService.create(paquete);
  }

  // Actualizar parcialmente un PaqueteCoberturas existente
  @Patch(':id/:usuario')
  async updatePartial(
    @Param('id') id: string,  // Recibe el ID del paquete de la URL
    @Param('usuario') usuario: string,  // Recibe el usuario como parámetro de la URL
    @Body() paquete: Partial<PaqueteCoberturas>,  // Recibe solo los campos de PaqueteCoberturas
  ): Promise<PaqueteCoberturas> {
    // Llama al servicio de actualización con los datos del paquete y el usuario
    const paqueteActualizado = await this.paqueteCoberturasService.update(
      Number(id),
      paquete,  // Pasa los campos de PaqueteCoberturas al servicio
      usuario  // Pasa el usuario como parámetro separado
    );

    if (!paqueteActualizado) {
      throw new HttpException('PaqueteCoberturas not found for partial update', HttpStatus.NOT_FOUND);
    }

    return paqueteActualizado;
  }

  // Eliminar un PaqueteCoberturas por ID
  // Eliminar un PaqueteCoberturas por ID y registrar en la bitácora
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Body('usuario') usuario: string,  // Recibe el usuario que realiza la eliminación
    @Body('motivo') motivo?: string,   // Recibe el motivo opcional
  ): Promise<void> {
    const paquete = await this.paqueteCoberturasService.findOne(Number(id));

    if (!paquete) {
      throw new HttpException('PaqueteCoberturas not found', HttpStatus.NOT_FOUND);
    }

    // Llama al servicio para eliminar el registro y registrar en la bitácora
    return this.paqueteCoberturasService.remove(Number(id), usuario, motivo);
  }
}
