import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { ApplicationsGruposService } from './aplicaciones-grupos.service';
import { ApplicationsGrupos } from './aplicaciones-grupos.entity';

@Controller('applications-grupos')
export class ApplicationsGruposController {
  constructor(private readonly applicationsGruposService: ApplicationsGruposService) {}

  
  @Post(':grupoId')
  async associateApplications(
    @Param('grupoId') grupoId: number,
    @Body('aplicaciones') aplicaciones: any[],
  ): Promise<{ message: string }> {
    await this.applicationsGruposService.associateApplications(grupoId, aplicaciones);
    return { message: `Las aplicaciones fueron asociadas exitosamente al grupo con ID ${grupoId}.` };
  }

  @Get()
  findAll(): Promise<ApplicationsGrupos[]> {
    return this.applicationsGruposService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number): Promise<ApplicationsGrupos> {
    return this.applicationsGruposService.findOne(id);
  }

  @Patch(':grupoId')
  async updateAssociations(
    @Param('grupoId') grupoId: number,
    @Body('aplicaciones') aplicaciones: any[],
  ): Promise<{ message: string }> {
    await this.applicationsGruposService.updateAssociations(grupoId, aplicaciones);
    return { message: `Las asociaciones del grupo con ID ${grupoId} fueron actualizadas correctamente.` };
  }

  @Delete(':grupoId')
  async removeAssociations(
    @Param('grupoId') grupoId: number,
    @Body('aplicacionesIds') aplicacionesIds: number[],
  ): Promise<{ message: string }> {
    await this.applicationsGruposService.removeAssociations(grupoId, aplicacionesIds);
    return { message: `Las asociaciones del grupo con ID ${grupoId} fueron eliminadas correctamente.` };
  }

}
