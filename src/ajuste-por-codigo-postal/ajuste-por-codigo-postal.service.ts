import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AjustePorCodigoPostal } from './ajuste-por-codigo-postal.entity';
import { CreateAjustePorCodigoPostalDto } from './dto/create-ajuste-por-codigo-postal.dto';
import { UpdateAjustePorCodigoPostalDto } from './dto/update-ajuste-por-codigo-postal.dto';


@Injectable()
export class AjustePorCodigoPostalService {
  constructor(
    @InjectRepository(AjustePorCodigoPostal,'db1')
    private readonly repository: Repository<AjustePorCodigoPostal>,
  ) {}

  async create(dto: CreateAjustePorCodigoPostalDto) {
    const ajuste = this.repository.create(dto);
    await this.repository.save(ajuste);
    return { message: 'Registro creado exitosamente', ajuste };
  }

  async findAll() {
    const ajustes = await this.repository.find();
    return { message: 'Consulta exitosa', ajustes };
  }

  async findOne(codigoPostal: string) {
    const ajuste = await this.repository.findOne({ where: { CodigoPostal: codigoPostal } });
    if (!ajuste) {
      throw new NotFoundException(`No se encontró el ajuste para el código postal: ${codigoPostal}`);
    }
    return { message: 'Consulta exitosa', ajuste };
  }

  async update(codigoPostal: string, dto: UpdateAjustePorCodigoPostalDto) {
    const ajuste = await this.repository.findOne({ where: { CodigoPostal: codigoPostal } });
    if (!ajuste) {
      throw new NotFoundException(`No se encontró el ajuste para el código postal: ${codigoPostal}`);
    }
    await this.repository.update(codigoPostal, dto);
    return { message: 'Registro actualizado exitosamente' };
  }

  async remove(codigoPostal: string) {
    const ajuste = await this.repository.findOne({ where: { CodigoPostal: codigoPostal } });
    if (!ajuste) {
      throw new NotFoundException(`No se encontró el ajuste para el código postal: ${codigoPostal}`);
    }
    await this.repository.delete(codigoPostal);
    return { message: 'Registro eliminado exitosamente' };
  }
}
