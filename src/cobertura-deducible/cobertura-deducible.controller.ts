import { Controller, Get, Post, Put, Delete, Param, Body, HttpException, HttpStatus, Patch } from '@nestjs/common';
import { CoberturaDeducibleService } from './cobertura-deducible.service';
import { Cobertura_Deducible } from './cobertura-deducible.entity';


@Controller('cobertura-deducible')
export class CoberturaDeducibleController {
  constructor(private readonly coberturaDeducibleService: CoberturaDeducibleService) {}

  // Obtener todas las asociaciones entre coberturas y deducibles
  @Get()
  findAll(): Promise<Cobertura_Deducible[]> {
    return this.coberturaDeducibleService.findAll();
  }

  // Crear una nueva asociación entre una cobertura y un deducible
  @Post()
  create(
    @Body('coberturaId') coberturaId: number,
    @Body('deducibleId') deducibleId: number,
  ): Promise<Cobertura_Deducible> {
    return this.coberturaDeducibleService.createAssociation(coberturaId, deducibleId);
  }

  // Eliminar una asociación por ID
  @Delete(':id')
  remove(@Param('id') id: number): Promise<void> {
    return this.coberturaDeducibleService.remove(id);
  }
}