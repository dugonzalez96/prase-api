import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EstatusPago } from './entities/estatus-pago.entity';

@Injectable()
export class EstatusPagoService {
  constructor(
    @InjectRepository(EstatusPago, 'db1')
    private readonly estatusPagoRepository: Repository<EstatusPago>,
  ) {}

  async findAll(): Promise<EstatusPago[]> {
    return await this.estatusPagoRepository.find();
  }

  async findOne(id: number): Promise<EstatusPago> {
    const estatusPago = await this.estatusPagoRepository.findOne({ where: { IDEstatusPago: id } });
    if (!estatusPago) {
      throw new HttpException('Estatus de pago no encontrado', HttpStatus.NOT_FOUND);
    }
    return estatusPago;
  }

  async create(data: { NombreEstatus: string }): Promise<EstatusPago> {
    const nuevoEstatus = this.estatusPagoRepository.create(data);
    return await this.estatusPagoRepository.save(nuevoEstatus);
  }

  async update(id: number, data: { NombreEstatus: string }): Promise<EstatusPago> {
    const estatusPago = await this.findOne(id);
    estatusPago.NombreEstatus = data.NombreEstatus;
    return await this.estatusPagoRepository.save(estatusPago);
  }

  async remove(id: number): Promise<string> {
    const estatusPago = await this.findOne(id);
    await this.estatusPagoRepository.remove(estatusPago);
    return `Estatus de pago con ID ${id} eliminado exitosamente.`;
  }
}
