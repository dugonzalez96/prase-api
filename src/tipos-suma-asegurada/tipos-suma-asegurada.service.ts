import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TiposSumaAsegurada } from './tipos-suma-asegurada.entity';

@Injectable()
export class TiposSumaAseguradaService   {
  constructor(
    @InjectRepository(TiposSumaAsegurada, 'db1')  // Si usas múltiples conexiones, 'db1' está bien
    private readonly tiposSumaAseguradaRepository: Repository<TiposSumaAsegurada>,
  ) {}

  // Crear un tipo de suma asegurada
  async create(tipoSumaAsegurada: TiposSumaAsegurada): Promise<TiposSumaAsegurada> {
    return this.tiposSumaAseguradaRepository.save(tipoSumaAsegurada);
  }

  // Obtener todos los tipos de suma asegurada
  async findAll(): Promise<TiposSumaAsegurada[]> {
    return this.tiposSumaAseguradaRepository.find();
  }

  // Obtener un tipo de suma asegurada por ID
  async findOne(id: number): Promise<TiposSumaAsegurada> {
    const tipoSumaAsegurada = await this.tiposSumaAseguradaRepository.findOne({ where: { TipoSumaAseguradaID: id } });
    if (!tipoSumaAsegurada) {
      throw new HttpException('Tipo de Suma Asegurada not found', HttpStatus.NOT_FOUND);
    }
    return tipoSumaAsegurada;
  }

  // Actualizar un tipo de suma asegurada
  async update(id: number, tipoSumaAsegurada: Partial<TiposSumaAsegurada>): Promise<TiposSumaAsegurada> {
    const tipoExistente = await this.findOne(id);
    if (!tipoExistente) {
      throw new HttpException('Tipo de Suma Asegurada not found', HttpStatus.NOT_FOUND);
    }
    await this.tiposSumaAseguradaRepository.update(id, tipoSumaAsegurada);
    return this.findOne(id);  // Devuelve el registro actualizado
  }

  // Eliminar un tipo de suma asegurada
  async remove(id: number): Promise<void> {
    const tipoExistente = await this.findOne(id);
    if (!tipoExistente) {
      throw new HttpException('Tipo de Suma Asegurada not found', HttpStatus.NOT_FOUND);
    }
    await this.tiposSumaAseguradaRepository.delete(id);
  }
}