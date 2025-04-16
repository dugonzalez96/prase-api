import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TiposVehiculo } from './tipos-vehiculo.entity';
import { CreateTipoVehiculoDto } from './dto/create-tipo-vehiculo.dto';
import { UpdateTipoVehiculoDto } from './dto/update-tipo-vehiculo.dto';
import { UsosVehiculo } from '../usos-vehiculo/usos-vehiculo.entity';

@Injectable()
export class TiposVehiculoService {
  constructor(
    @InjectRepository(TiposVehiculo, 'db1')
    private readonly tiposVehiculoRepository: Repository<TiposVehiculo>,
    
    @InjectRepository(UsosVehiculo, 'db1')
    private readonly usosVehiculoRepository: Repository<UsosVehiculo>,  // Inyectamos el repositorio de UsosVehiculo
  ) {}

  async create(createTipoVehiculoDto: CreateTipoVehiculoDto): Promise<TiposVehiculo> {
    const { UsoID, ...rest } = createTipoVehiculoDto;

    // Buscar el uso de vehículo por ID antes de crear el tipo de vehículo
    const uso = await this.usosVehiculoRepository.findOne({ where: { UsoID } });
    if (!uso) {
      throw new HttpException('Uso de Vehículo no encontrado', HttpStatus.NOT_FOUND);
    }

    // Crear el tipo de vehículo asignándole el uso encontrado
    const tipoVehiculo = this.tiposVehiculoRepository.create({ ...rest, uso });
    return this.tiposVehiculoRepository.save(tipoVehiculo);
  }

  async findAll(): Promise<TiposVehiculo[]> {
    return this.tiposVehiculoRepository.find({ relations: ['uso'] });
  }

  async findOne(id: number): Promise<TiposVehiculo> {
    const tipoVehiculo = await this.tiposVehiculoRepository.findOne({ where: { TipoID: id }, relations: ['uso'] });
    if (!tipoVehiculo) {
      throw new HttpException('Tipo de Vehículo no encontrado', HttpStatus.NOT_FOUND);
    }
    return tipoVehiculo;
  }

  async update(id: number, updateTipoVehiculoDto: UpdateTipoVehiculoDto): Promise<TiposVehiculo> {
    const { UsoID, ...rest } = updateTipoVehiculoDto;

    const tipoVehiculo = await this.findOne(id);
    if (!tipoVehiculo) {
      throw new HttpException('Tipo de Vehículo no encontrado', HttpStatus.NOT_FOUND);
    }

    // Si se proporcionó UsoID, buscar el nuevo UsoVehiculo
    if (UsoID) {
      const uso = await this.usosVehiculoRepository.findOne({ where: { UsoID } });
      if (!uso) {
        throw new HttpException('Uso de Vehículo no encontrado', HttpStatus.NOT_FOUND);
      }
      tipoVehiculo.uso = uso;
    }

    Object.assign(tipoVehiculo, rest);

    return this.tiposVehiculoRepository.save(tipoVehiculo);
  }

  async remove(id: number): Promise<{ message: string }> {
    const tipoVehiculo = await this.findOne(id);
    if (!tipoVehiculo) {
      throw new HttpException('Tipo de Vehículo no encontrado', HttpStatus.NOT_FOUND);
    }

    await this.tiposVehiculoRepository.delete(id);

    return { message: `Tipo de Vehículo con ID ${id} eliminado con éxito` };
  }
}
