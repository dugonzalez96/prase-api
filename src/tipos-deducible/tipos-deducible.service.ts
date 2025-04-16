import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TiposDeducible } from './tipos-deducible.entity';
import { CreateTipoDeducibleDto } from './dto/create-tipo-deducible.dto';
import { UpdateTipoDeducibleDto } from './dto/update-tipo-deducible.dto';

@Injectable()
export class TiposDeducibleService {
  constructor(
    @InjectRepository(TiposDeducible, 'db1')
    private readonly tiposDeducibleRepository: Repository<TiposDeducible>,
  ) {}

  create(createTipoDeducibleDto: CreateTipoDeducibleDto): Promise<TiposDeducible> {
    const tipoDeducible = this.tiposDeducibleRepository.create(createTipoDeducibleDto);
    return this.tiposDeducibleRepository.save(tipoDeducible);
  }

  findAll(): Promise<TiposDeducible[]> {
    return this.tiposDeducibleRepository.find();
  }

  async findOne(id: number): Promise<TiposDeducible> {
    const tipoDeducible = await this.tiposDeducibleRepository.findOne({ where: { TipoDeducibleID: id } });
    if (!tipoDeducible) {
      throw new HttpException('Tipo de deducible no encontrado', HttpStatus.NOT_FOUND);
    }
    return tipoDeducible;
  }

  async update(id: number, updateTipoDeducibleDto: UpdateTipoDeducibleDto): Promise<TiposDeducible> {
    const tipoDeducible = await this.findOne(id);
    await this.tiposDeducibleRepository.update(id, updateTipoDeducibleDto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<{ message: string }> {
    const tipoDeducible = await this.findOne(id);
    if (!tipoDeducible) {
      throw new HttpException('Tipo de deducible no encontrado', HttpStatus.NOT_FOUND);
    }
  
    await this.tiposDeducibleRepository.delete(id);
  
    // Retorna un mensaje de éxito después de la eliminación
    return { message: `Tipo de deducible con ID ${id} eliminado exitosamente` };
  }
  
}
