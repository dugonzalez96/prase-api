import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { AplicacionReglasService } from './aplicacion-reglas.service';
import { AplicacionReglas } from './aplicacion-reglas.entity';

@Controller('aplicacion-reglas')
export class AplicacionReglasController {
  constructor(private readonly aplicacionReglasService: AplicacionReglasService) {}

  // Obtener todas las aplicaciones de reglas
  @Get()
  findAll(): Promise<AplicacionReglas[]> {
    return this.aplicacionReglasService.findAll();
  }

  // Obtener una aplicación de reglas por ID
  @Get(':id')
  findOne(@Param('id') id: number): Promise<AplicacionReglas> {
    return this.aplicacionReglasService.findOne(id);
  }

  // Crear una nueva aplicación de reglas
  @Post()
  create(@Body() aplicacion: Partial<AplicacionReglas>): Promise<AplicacionReglas> {
    return this.aplicacionReglasService.create(aplicacion);
  }
}
