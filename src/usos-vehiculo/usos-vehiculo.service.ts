import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsosVehiculo } from './usos-vehiculo.entity';

@Injectable()
export class UsosVehiculoService {
  constructor(
    @InjectRepository(UsosVehiculo, 'db1')
    private readonly usosVehiculoRepository: Repository<UsosVehiculo>,
  ) {}

  async findAll(): Promise<UsosVehiculo[]> {
    return this.usosVehiculoRepository.find();
  }

  async findOne(id: number): Promise<UsosVehiculo> {
    const usoVehiculo = await this.usosVehiculoRepository.findOne({ where: { UsoID: id } });
    if (!usoVehiculo) {
      throw new HttpException('Uso de Vehículo no encontrado', HttpStatus.NOT_FOUND);
    }
    return usoVehiculo;
  }

  async create(usoVehiculo: UsosVehiculo): Promise<{ message: string }> {
    await this.usosVehiculoRepository.save(usoVehiculo);
    return { message: 'Uso de Vehículo creado con éxito' };
  }

  async update(id: number, usoVehiculo: Partial<UsosVehiculo>): Promise<{ message: string }> {
    const existingUso = await this.findOne(id);
    if (!existingUso) {
      throw new HttpException('Uso de Vehículo no encontrado', HttpStatus.NOT_FOUND);
    }

    await this.usosVehiculoRepository.update(id, usoVehiculo);
    return { message: 'Uso de Vehículo actualizado con éxito' };
  }

  async remove(id: number): Promise<{ message: string }> {
    const usoVehiculo = await this.findOne(id);
    if (!usoVehiculo) {
      throw new HttpException('Uso de Vehículo no encontrado', HttpStatus.NOT_FOUND);
    }

    await this.usosVehiculoRepository.delete(id);
    return { message: 'Uso de Vehículo eliminado con éxito' };
  }
}
