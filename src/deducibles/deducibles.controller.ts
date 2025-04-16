import { Controller, Get, Post, Put, Delete, Param, Body, HttpException, HttpStatus, Patch } from '@nestjs/common';
import { DeduciblesService } from './deducibles.service';
import { Deducibles } from './deducibles.entity';

@Controller('deducibles')
export class DeduciblesController {
  constructor(private readonly deduciblesService: DeduciblesService) {}

  // Obtener todos los deducibles
  @Get()
  findAll(): Promise<Deducibles[]> {
    return this.deduciblesService.findAll();
  }

  // Obtener un deducible por ID
  @Get(':id')
  findOne(@Param('id') id: number): Promise<Deducibles> {
    return this.deduciblesService.findOne(id);
  }

  // Crear un nuevo deducible
  @Post()
  create(@Body() deducible: Deducibles): Promise<Deducibles> {
    return this.deduciblesService.create(deducible);
  }

  // Actualizar un deducible existente
  @Patch(':id')
  update(@Param('id') id: number, @Body() deducible: Partial<Deducibles>): Promise<Deducibles> {
    return this.deduciblesService.update(id, deducible);
  }

  // Eliminar un deducible por ID
  @Delete(':id')
  remove(@Param('id') id: number): Promise<void> {
    return this.deduciblesService.remove(id);
  }
}