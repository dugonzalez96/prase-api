import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MetodosPago } from './entities/metodos-pago.entity';

@Injectable()
export class MetodosPagoService {
  constructor(
    @InjectRepository(MetodosPago, 'db1')
    private readonly metodosPagoRepository: Repository<MetodosPago>,
  ) {}

  async findAll(): Promise<MetodosPago[]> {
    return await this.metodosPagoRepository.find();
  }

  async findOne(id: number): Promise<MetodosPago> {
    const metodoPago = await this.metodosPagoRepository.findOne({ where: { IDMetodoPago: id } });
    if (!metodoPago) {
      throw new HttpException('Método de pago no encontrado', HttpStatus.NOT_FOUND);
    }
    return metodoPago;
  }

  async create(data: { NombreMetodo: string }): Promise<MetodosPago> {
    const nuevoMetodo = this.metodosPagoRepository.create(data);
    return await this.metodosPagoRepository.save(nuevoMetodo);
  }

  async update(id: number, data: { NombreMetodo: string }): Promise<MetodosPago> {
    const metodoPago = await this.findOne(id);
    metodoPago.NombreMetodo = data.NombreMetodo;
    return await this.metodosPagoRepository.save(metodoPago);
  }

  async remove(id: number): Promise<string> {
    const metodoPago = await this.findOne(id);
    await this.metodosPagoRepository.remove(metodoPago);
    return `Método de pago con ID ${id} eliminado exitosamente.`;
  }
}
