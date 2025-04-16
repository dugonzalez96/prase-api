import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehiculos } from './vehiculos.entity';
import { BitacoraEliminacionesService } from '../bitacora-eliminaciones/bitacora-eliminaciones.service';  // Importa el servicio de la bitácora
import { BitacoraEdicionesService } from '../bitacora-ediciones/bitacora-ediciones.service';  // Importa el servicio de la bitácora

@Injectable()
export class VehiculosService {
  constructor(
    @InjectRepository(Vehiculos, 'db1')
    private readonly vehiculosRepository: Repository<Vehiculos>,
    private readonly bitacoraEliminacionesService: BitacoraEliminacionesService,
    private readonly bitacoraEdicionesService: BitacoraEdicionesService,
  ) {}

  // Crear un nuevo vehículo
  async create(vehiculo: Partial<Vehiculos>): Promise<Vehiculos> {
    return this.vehiculosRepository.save(vehiculo);
  }

  // Obtener todos los vehículos
  async findAll(): Promise<Vehiculos[]> {
    return this.vehiculosRepository.find();
  }

  // Obtener un vehículo por ID
  async findOne(id: number): Promise<Vehiculos> {
    const vehiculo = await this.vehiculosRepository.findOne({ where: { VehiculoID: id } });
    if (!vehiculo) {
      throw new HttpException('Vehículo no encontrado', HttpStatus.NOT_FOUND);
    }
    return vehiculo;
  }

  // Actualizar un vehículo y registrar en la bitácora de ediciones
  async update(id: number, vehiculo: Partial<Vehiculos>, usuario: string): Promise<Vehiculos> {
    const vehiculoExistente = await this.findOne(id);

    if (!vehiculoExistente) {
      throw new HttpException('Vehículo no encontrado', HttpStatus.NOT_FOUND);
    }

    // Realiza la actualización
    await this.vehiculosRepository.update(id, vehiculo);

    // Calcula los campos modificados
    const camposModificados = {};
    for (const key in vehiculo) {
      if (vehiculo[key] !== vehiculoExistente[key]) {
        camposModificados[key] = {
          anterior: vehiculoExistente[key],
          nuevo: vehiculo[key],
        };
      }
    }

    // Registrar la edición en la bitácora
    if (Object.keys(camposModificados).length > 0) {
      await this.bitacoraEdicionesService.registrarEdicion(
        'Vehiculos',
        id,
        camposModificados,
        usuario,
      );
    }

    return this.findOne(id);
  }

  // Eliminar un vehículo y registrar en la bitácora de eliminaciones
  async remove(id: number, usuario: string, motivo?: string): Promise<void> {
    const vehiculoExistente = await this.findOne(id);

    if (!vehiculoExistente) {
      throw new HttpException('Vehículo no encontrado', HttpStatus.NOT_FOUND);
    }

    // Eliminar el vehículo
    await this.vehiculosRepository.delete(id);

    // Registrar la eliminación en la bitácora
    await this.bitacoraEliminacionesService.registrarEliminacion(
      'Vehiculos',
      id,
      usuario,
      motivo || 'Eliminación no especificada',
    );
  }
}