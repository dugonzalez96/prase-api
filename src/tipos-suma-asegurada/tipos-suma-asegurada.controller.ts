import { Controller, Get, Post, Put, Delete, Param, Body, HttpException, HttpStatus, Patch } from '@nestjs/common';
import { TiposSumaAseguradaService } from './tipos-suma-asegurada.service';
import { TiposSumaAsegurada } from './tipos-suma-asegurada.entity';



@Controller('tipos-suma-asegurada')
export class TiposSumaAseguradaController {
  constructor(private readonly tiposSumaAseguradaService: TiposSumaAseguradaService) {}

  // Obtener todos los tipos de suma asegurada
  @Get()
  findAll(): Promise<TiposSumaAsegurada[]> {
    return this.tiposSumaAseguradaService.findAll();
  }

  // Obtener un tipo de suma asegurada por ID
  @Get(':id')
  findOne(@Param('id') id: number): Promise<TiposSumaAsegurada> {
    return this.tiposSumaAseguradaService.findOne(id);
  }

  // Crear un nuevo tipo de suma asegurada
  @Post()
  create(@Body() tipoSumaAsegurada: TiposSumaAsegurada): Promise<TiposSumaAsegurada> {
    return this.tiposSumaAseguradaService.create(tipoSumaAsegurada);
  }

  // Actualizar un tipo de suma asegurada existente
  @Patch(':id')
  update(@Param('id') id: number, @Body() tipoSumaAsegurada: Partial<TiposSumaAsegurada>): Promise<TiposSumaAsegurada> {
    return this.tiposSumaAseguradaService.update(id, tipoSumaAsegurada);
  }

  // Eliminar un tipo de suma asegurada por ID
  @Delete(':id')
  remove(@Param('id') id: number): Promise<void> {
    return this.tiposSumaAseguradaService.remove(id);
  }
}