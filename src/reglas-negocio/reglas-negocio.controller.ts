import { Controller, Get, Post, Put, Delete, Param, Body, Patch, Query } from '@nestjs/common';
import { ReglasNegocioService } from './reglas-negocio.service';
import { ReglasNegocio } from './reglas-negocio.entity';
import { Coberturas } from 'src/coberturas/coberturas.entity';

@Controller('reglas-negocio')
export class ReglasNegocioController {
  constructor(private readonly reglasNegocioService: ReglasNegocioService) { }

  @Get('cobertura-especial')
  getCoberturasPorEspecial(@Query('especial') especial: string) {
    const isEspecial = especial === 'true';
    return this.reglasNegocioService.getCoberturasPorEspecial(isEspecial);
  }

  // Obtener reglas globales o específicas
  @Get('regla-global')
  getReglasPorGlobal(@Query('global') global: string) {
    const isGlobal = global === 'true';
    return this.reglasNegocioService.getReglasPorGlobal(isGlobal);
  }

  // Obtener reglas por ID de cobertura específica
  @Get('reglas-por-cobertura/:idCobertura')
  getReglasPorCobertura(@Param('idCobertura') idCobertura: number) {
    return this.reglasNegocioService.getReglasPorCobertura(idCobertura);
  }


  // Obtener todas las reglas de negocio con coberturas y condiciones
  @Get()
  findAll(): Promise<ReglasNegocio[]> {
    return this.reglasNegocioService.findAll();
  }


  // Obtener una regla de negocio por ID (coloca esta al final)
  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.reglasNegocioService.findOne(id);
  }

  // Crear una regla de negocio nueva
  @Post()
  create(@Body() regla: Partial<ReglasNegocio>): Promise<ReglasNegocio> {
    return this.reglasNegocioService.create(regla);
  }

  // Actualizar una regla de negocio existente
  @Patch(':id/:usuario')
  update(
    @Param('id') id: number,
    @Param('usuario') usuario: string,
    @Body() regla: Partial<ReglasNegocio>
  ): Promise<ReglasNegocio> {
    return this.reglasNegocioService.update(id, regla, usuario);
  }

  // Eliminar una regla de negocio por ID
  @Delete(':id/:usuario')
  async remove(
    @Param('id') id: number,
    @Param('usuario') usuario: string,
    @Body('motivo') motivo?: string
  ): Promise<{ message: string }> {
    await this.reglasNegocioService.remove(id, usuario, motivo);
    return { message: `La regla de negocio con ID ${id} ha sido eliminada por ${usuario}.` };
  }
}
