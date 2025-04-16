import { Controller, Get, Post, Put, Delete, Param, Body, HttpException, HttpStatus, Patch } from '@nestjs/common';
import { PaqueteCobertura_CoberturaService } from './paquete-cobertura-cobertura.service';
import { PaqueteCobertura_Cobertura } from './paquete-cobertura-cobertura.entity';

@Controller('asociar-cobertura')
export class PaqueteCobertura_CoberturaController {
  constructor(private readonly paqueteCoberturaService: PaqueteCobertura_CoberturaService) { }

  // Crear la asociación entre un paquete y varias coberturas
  @Post(':paqueteCoberturaId')
  async associateCoberturas(
    @Param('paqueteCoberturaId') paqueteCoberturaId: number,
    @Body('coberturas') coberturas: { CoberturaID: number, obligatoria: boolean }[],
  ): Promise<PaqueteCobertura_Cobertura[]> {
    return this.paqueteCoberturaService.createAssociation(paqueteCoberturaId, coberturas);
  }

  // Actualizar asociaciones específicas y registrar en bitácora de actualización
  @Patch(':paqueteCoberturaId')
  async updateAssociations(
    @Param('paqueteCoberturaId') paqueteCoberturaId: number,
    @Body('coberturas') coberturas: { CoberturaID: number, obligatoria: boolean }[],
    @Body('usuario') usuario: string,
  ): Promise<{ message: string }> {  // Cambiamos a un retorno que espera un mensaje
    return this.paqueteCoberturaService.updateAssociation(paqueteCoberturaId, coberturas, usuario);
  }


  // Eliminar asociaciones específicas entre un paquete y coberturas y registrar en bitácora de eliminación
  @Delete(':paqueteCoberturaId')
  async removeAssociations(
    @Param('paqueteCoberturaId') paqueteCoberturaId: number,
    @Body('coberturaIds') coberturaIds: number[],
    @Body('usuario') usuario: string,
  ): Promise<void> {
    return this.paqueteCoberturaService.removeAssociation(paqueteCoberturaId, coberturaIds, usuario);
  }

  // Eliminar todas las asociaciones de un paquete y registrar en bitácora de eliminación
  @Delete(':paqueteCoberturaId/all')
  async removeAllAssociations(
    @Param('paqueteCoberturaId') paqueteCoberturaId: number,
    @Body('usuario') usuario: string,
  ): Promise<void> {
    return this.paqueteCoberturaService.removeAllAssociations(paqueteCoberturaId, usuario);
  }

  // Obtener todas las asociaciones entre paquetes y coberturas
  @Get()
  async getAllAssociations() {
    return this.paqueteCoberturaService.findAll();
  }
}
