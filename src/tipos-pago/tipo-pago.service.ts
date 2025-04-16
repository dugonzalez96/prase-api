import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TipoPago } from './tipo-pago.entity';
import { CreateTipoPagoDto } from './dto/create-tipo-pago.dto';
import { UpdateTipoPagoDto } from './dto/update-tipo-pago.dto';

@Injectable()
export class TipoPagoService {
  constructor(
    @InjectRepository(TipoPago, 'db1')
    private readonly tipoPagoRepository: Repository<TipoPago>,
  ) {}

  async create(createTipoPagoDto: CreateTipoPagoDto): Promise<TipoPago> {
    const nuevoTipoPago = this.tipoPagoRepository.create(createTipoPagoDto);
    return this.tipoPagoRepository.save(nuevoTipoPago);
  }

  async findAll(): Promise<TipoPago[]> {
    return this.tipoPagoRepository.find();
  }

  async findOne(id: number): Promise<TipoPago> {
    const tipoPago = await this.tipoPagoRepository.findOne({ where: { TipoPagoID: id } });
    if (!tipoPago) {
      throw new HttpException('Tipo de Pago no encontrado', HttpStatus.NOT_FOUND);
    }
    return tipoPago;
  }

  async update(id: number, updateTipoPagoDto: UpdateTipoPagoDto): Promise<TipoPago> {
    const tipoPago = await this.findOne(id);
    Object.assign(tipoPago, updateTipoPagoDto);
    return this.tipoPagoRepository.save(tipoPago);
  }

  async remove(id: number): Promise<void> {
    const tipoPago = await this.findOne(id);
    await this.tipoPagoRepository.remove(tipoPago);
  }
}
