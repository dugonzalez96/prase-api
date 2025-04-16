import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TiposMoneda } from './tipos-moneda.entity';
import { CreateTipoMonedaDto } from './dto/create-tipo-moneda.dto';
import { UpdateTipoMonedaDto } from './dto/update-tipo-moneda.dto';

@Injectable()
export class TiposMonedaService {
  constructor(
    @InjectRepository(TiposMoneda, 'db1')
    private readonly tiposMonedaRepository: Repository<TiposMoneda>,
  ) {}

  create(createTipoMonedaDto: CreateTipoMonedaDto): Promise<TiposMoneda> {
    const tipoMoneda = this.tiposMonedaRepository.create(createTipoMonedaDto);
    return this.tiposMonedaRepository.save(tipoMoneda);
  }

  findAll(): Promise<TiposMoneda[]> {
    return this.tiposMonedaRepository.find();
  }

  async findOne(id: number): Promise<TiposMoneda> {
    const tipoMoneda = await this.tiposMonedaRepository.findOne({ where: { TipoMonedaID: id } });
    if (!tipoMoneda) {
      throw new HttpException('Tipo de moneda no encontrado', HttpStatus.NOT_FOUND);
    }
    return tipoMoneda;
  }

  async update(id: number, updateTipoMonedaDto: UpdateTipoMonedaDto): Promise<TiposMoneda> {
    const tipoMoneda = await this.findOne(id);
    await this.tiposMonedaRepository.update(id, updateTipoMonedaDto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<string> {
    const tipoMoneda = await this.findOne(id);
    if (!tipoMoneda) {
      throw new HttpException('Tipo de moneda no encontrado', HttpStatus.NOT_FOUND);
    }
    await this.tiposMonedaRepository.delete(id);
    return `El tipo de moneda con ID ${id} ha sido eliminado exitosamente.`;
  }
  
}
