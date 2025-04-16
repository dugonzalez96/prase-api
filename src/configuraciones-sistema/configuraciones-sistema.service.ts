import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfiguracionesSistema } from './configuraciones-sistema.entity';
import { BitacoraEliminacionesService } from '../bitacora-eliminaciones/bitacora-eliminaciones.service';
import { BitacoraEdicionesService } from '../bitacora-ediciones/bitacora-ediciones.service';

@Injectable()
export class ConfiguracionesSistemaService {
  constructor(
    @InjectRepository(ConfiguracionesSistema, 'db1')
    private readonly configuracionesSistemaRepository: Repository<ConfiguracionesSistema>,
    private readonly bitacoraEliminacionesService: BitacoraEliminacionesService,
    private readonly bitacoraEdicionesService: BitacoraEdicionesService,
  ) {}

  // Crear una configuración
  async create(configuracion: ConfiguracionesSistema): Promise<ConfiguracionesSistema> {
    return this.configuracionesSistemaRepository.save(configuracion);
  }

  // Obtener todas las configuraciones
  async findAll(): Promise<ConfiguracionesSistema[]> {
    return this.configuracionesSistemaRepository.find();
  }

  // Obtener una configuración por ID
  async findOne(id: number): Promise<ConfiguracionesSistema> {
    const configuracion = await this.configuracionesSistemaRepository.findOne({ where: { ConfiguracionID: id } });
    if (!configuracion) {
      throw new HttpException('Configuración no encontrada', HttpStatus.NOT_FOUND);
    }
    return configuracion;
  }

  // Obtener una configuración por nombre
  async findByNombre(nombre: string): Promise<ConfiguracionesSistema> {
    const configuracion = await this.configuracionesSistemaRepository.findOne({
      where: { NombreConfiguracion: nombre },
    });
    if (!configuracion) {
      throw new HttpException('Configuración no encontrada', HttpStatus.NOT_FOUND);
    }
    return configuracion;
  }

  // Actualizar una configuración y registrar en la bitácora de ediciones
  async update(id: number, configuracion: Partial<ConfiguracionesSistema>, usuario: string): Promise<ConfiguracionesSistema> {
    const configuracionExistente = await this.findOne(id);
    if (!configuracionExistente) {
      throw new HttpException('Configuración no encontrada', HttpStatus.NOT_FOUND);
    }

    // Realiza la actualización
    await this.configuracionesSistemaRepository.update(id, configuracion);

    // Calcula los campos modificados
    const camposModificados = {};
    for (const key in configuracion) {
      if (configuracion[key] !== configuracionExistente[key]) {
        camposModificados[key] = {
          anterior: configuracionExistente[key],
          nuevo: configuracion[key],
        };
      }
    }

    // Registrar en la bitácora de ediciones si hubo cambios
    if (Object.keys(camposModificados).length > 0) {
      await this.bitacoraEdicionesService.registrarEdicion(
        'ConfiguracionesSistema',
        id,
        camposModificados,
        usuario,
      );
    }

    return this.findOne(id);
  }

  // Eliminar una configuración y registrar en la bitácora de eliminaciones
  async remove(id: number, usuario: string, motivo?: string): Promise<void> {
    const configuracionExistente = await this.findOne(id);
    if (!configuracionExistente) {
      throw new HttpException('Configuración no encontrada', HttpStatus.NOT_FOUND);
    }

    await this.configuracionesSistemaRepository.delete(id);

    await this.bitacoraEliminacionesService.registrarEliminacion(
      'ConfiguracionesSistema',
      id,
      usuario,
      motivo || 'Eliminación realizada por el usuario',
    );
  }
}
