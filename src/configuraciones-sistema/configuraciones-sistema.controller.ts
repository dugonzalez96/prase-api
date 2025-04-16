import { Controller, Get, Post, Put, Delete, Param, Body, Patch } from '@nestjs/common';
import { ConfiguracionesSistemaService } from './configuraciones-sistema.service';
import { ConfiguracionesSistema } from './configuraciones-sistema.entity';

@Controller('configuraciones-sistema')
export class ConfiguracionesSistemaController {
  constructor(private readonly configuracionesSistemaService: ConfiguracionesSistemaService) {}

  // Obtener todas las configuraciones del sistema
  @Get()
  findAll(): Promise<ConfiguracionesSistema[]> {
    return this.configuracionesSistemaService.findAll();
  }

  // Obtener una configuración por ID
  @Get(':id')
  findOne(@Param('id') id: number): Promise<ConfiguracionesSistema> {
    return this.configuracionesSistemaService.findOne(id);
  }

  // Obtener una configuración por nombre
  @Get('nombre/:nombre')
  findByNombre(@Param('nombre') nombre: string): Promise<ConfiguracionesSistema> {
    return this.configuracionesSistemaService.findByNombre(nombre);
  }

  // Crear una nueva configuración
  @Post()
  create(@Body() configuracion: ConfiguracionesSistema): Promise<ConfiguracionesSistema> {
    return this.configuracionesSistemaService.create(configuracion);
  }

  // Actualizar una configuración existente y registrar en la bitácora de ediciones (recibe el usuario en los params)
  @Patch(':id/:usuario')
  update(
    @Param('id') id: number, 
    @Param('usuario') usuario: string,
    @Body() configuracion: Partial<ConfiguracionesSistema>
  ): Promise<ConfiguracionesSistema> {
    return this.configuracionesSistemaService.update(id, configuracion, usuario);
  }

  // Eliminar una configuración por ID y registrar en la bitácora de eliminaciones (recibe el usuario en los params)
  @Delete(':id/:usuario')
  remove(
    @Param('id') id: number,
    @Param('usuario') usuario: string,
    @Body('motivo') motivo?: string
  ): Promise<void> {
    return this.configuracionesSistemaService.remove(id, usuario, motivo);
  }
}
