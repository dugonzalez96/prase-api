import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApplicationsGrupos } from './aplicaciones-grupos.entity';
import { aplicaciones } from '../applications/applications.entity';
import { grupos } from '../groups/groups.entity';

@Injectable()
export class ApplicationsGruposService {
  constructor(
    @InjectRepository(ApplicationsGrupos, 'db1')
    private readonly applicationsGruposRepository: Repository<ApplicationsGrupos>,
    @InjectRepository(aplicaciones, 'db1')
    private readonly aplicacionesRepository: Repository<aplicaciones>,
    @InjectRepository(grupos, 'db1')
    private readonly gruposRepository: Repository<grupos>,
  ) { }


  // Crear asociaciones entre grupo y aplicaciones
  async associateApplications(grupoId: number, aplicacionesData: any[]): Promise<void> {
    const grupo = await this.gruposRepository.findOne({ where: { id: grupoId } });

    if (!grupo) {
      throw new Error('Grupo no encontrado');
    }

    for (const appData of aplicacionesData) {
      const aplicacion = await this.aplicacionesRepository.findOne({
        where: { id: appData.aplicacionId },
      });

      if (!aplicacion) {
        throw new Error(`Aplicación con ID ${appData.aplicacionId} no encontrada`);
      }

      const association = this.applicationsGruposRepository.create({
        aplicaciones: aplicacion,
        grupos: grupo,
        ingresar: appData.ingresar,
        insertar: appData.insertar,
        eliminar: appData.eliminar,
        actualizar: appData.actualizar,
      });

      await this.applicationsGruposRepository.save(association);
    }
  }

  // Actualizar asociaciones entre grupo y aplicaciones
  async updateAssociations(grupoId: number, aplicacionesData: any[]): Promise<void> {
    const grupo = await this.gruposRepository.findOne({ where: { id: grupoId } });

    if (!grupo) {
      throw new Error('Grupo no encontrado');
    }

    for (const appData of aplicacionesData) {
      const aplicacion = await this.aplicacionesRepository.findOne({
        where: { id: appData.aplicacionId },
      });

      if (!aplicacion) {
        throw new Error(`Aplicación con ID ${appData.aplicacionId} no encontrada`);
      }

      const existingAssociation = await this.applicationsGruposRepository.findOne({
        where: {
          aplicaciones: aplicacion,
          grupos: grupo,
        },
      });

      if (existingAssociation) {
        // Actualiza la asociación existente
        existingAssociation.ingresar = appData.ingresar;
        existingAssociation.insertar = appData.insertar;
        existingAssociation.eliminar = appData.eliminar;
        existingAssociation.actualizar = appData.actualizar;
        await this.applicationsGruposRepository.save(existingAssociation);
      } else {
        throw new Error(
          `No existe una asociación entre el grupo ${grupoId} y la aplicación ${appData.aplicacionId}`,
        );
      }
    }
  }
  // Eliminar asociaciones entre grupo y aplicaciones

  async removeAssociations(grupoId: number, aplicacionesIds: number[]): Promise<void> {
    const grupo = await this.gruposRepository.findOne({ where: { id: grupoId } });

    if (!grupo) {
      throw new Error('Grupo no encontrado');
    }

    for (const aplicacionId of aplicacionesIds) {
      const aplicacion = await this.aplicacionesRepository.findOne({ where: { id: aplicacionId } });

      if (!aplicacion) {
        throw new Error(`Aplicación con ID ${aplicacionId} no encontrada`);
      }

      const association = await this.applicationsGruposRepository.findOne({
        where: {
          aplicaciones: aplicacion,
          grupos: grupo,
        },
      });

      if (association) {
        await this.applicationsGruposRepository.delete({
          aplicaciones: { id: aplicacionId }, // Aquí utilizamos las claves adecuadas
          grupos: { id: grupoId }
        });
      } else {
        throw new Error(
          `No existe una asociación entre el grupo ${grupoId} y la aplicación ${aplicacionId}`,
        );
      }
    }
  }


  async createMultipleApplications(data: { grupoId: number, aplicacionesIds: number[], ingresar: boolean, insertar: boolean, eliminar: boolean, actualizar: boolean }): Promise<ApplicationsGrupos[]> {
    const group = await this.gruposRepository.findOne({ where: { id: data.grupoId } });

    if (!group) {
      throw new HttpException('Grupo no encontrado', HttpStatus.NOT_FOUND);
    }

    const relaciones = [];

    for (const appId of data.aplicacionesIds) {
      const app = await this.aplicacionesRepository.findOne({ where: { id: appId } });
      if (!app) {
        throw new HttpException(`Application con ID ${appId} no encontrada`, HttpStatus.NOT_FOUND);
      }

      const nuevaRelacion = this.applicationsGruposRepository.create({
        aplicaciones: app,
        grupos: group,
        ingresar: data.ingresar,
        insertar: data.insertar,
        eliminar: data.eliminar,
        actualizar: data.actualizar,
      });

      relaciones.push(await this.applicationsGruposRepository.save(nuevaRelacion));
    }

    return relaciones;
  }

  // Obtener todos los registros con las relaciones
  async findAll(): Promise<ApplicationsGrupos[]> {
    return this.applicationsGruposRepository.find({ relations: ['aplicaciones', 'grupos'] });
  }

  // Obtener un registro por ID
  async findOne(id: number): Promise<ApplicationsGrupos> {
    const registro = await this.applicationsGruposRepository.findOne({
      where: { id },
      relations: ['aplicaciones', 'grupos'],
    });
    if (!registro) {
      throw new HttpException('Registro no encontrado', HttpStatus.NOT_FOUND);
    }
    return registro;
  }

  // Actualizar un registro por ID
  async update(id: number, data: Partial<ApplicationsGrupos>): Promise<ApplicationsGrupos> {
    const registroExistente = await this.findOne(id);
    if (!registroExistente) {
      throw new HttpException('Registro no encontrado', HttpStatus.NOT_FOUND);
    }

    if (data.aplicaciones && data.aplicaciones.id) {
      const app = await this.aplicacionesRepository.findOne({ where: { id: data.aplicaciones.id } });
      if (!app) {
        throw new HttpException('Application no encontrada', HttpStatus.NOT_FOUND);
      }
      registroExistente.aplicaciones = app;
    }

    if (data.grupos && data.grupos.id) {
      const group = await this.gruposRepository.findOne({ where: { id: data.grupos.id } });
      if (!group) {
        throw new HttpException('Group no encontrado', HttpStatus.NOT_FOUND);
      }
      registroExistente.grupos = group;
    }

    Object.assign(registroExistente, data);

    return this.applicationsGruposRepository.save(registroExistente);
  }

  // Eliminar un registro por ID
  async remove(id: number): Promise<void> {
    const registro = await this.findOne(id);
    if (!registro) {
      throw new HttpException('Registro no encontrado', HttpStatus.NOT_FOUND);
    }
    await this.applicationsGruposRepository.delete(id);
  }
}