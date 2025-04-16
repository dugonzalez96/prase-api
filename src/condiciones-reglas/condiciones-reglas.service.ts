import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CondicionesReglas } from './condiciones-reglas.entity';
import { ReglasNegocio } from '../reglas-negocio/reglas-negocio.entity';
import CreateCondicionReglaDto from './dto/create-condicion-regla.dto';

@Injectable()
export class CondicionesReglasService {
  constructor(
    @InjectRepository(CondicionesReglas, 'db1') // Si usas múltiples conexiones, 'db1' está bien
    private readonly condicionesReglasRepository: Repository<CondicionesReglas>,
    @InjectRepository(ReglasNegocio, 'db1')
    private readonly reglasNegocioRepository: Repository<ReglasNegocio>,
  ) {}

  async create(
    condicionDto: CreateCondicionReglaDto,
  ): Promise<CondicionesReglas> {
    // Verificar si la regla existe
    const regla = await this.reglasNegocioRepository.findOne({
      where: { ReglaID: condicionDto.ReglaID },
    });
    if (!regla) {
      throw new HttpException('Regla no encontrada', HttpStatus.NOT_FOUND);
    }

    // Crear la nueva condición con la regla y la moneda si existe
    const nuevaCondicion = this.condicionesReglasRepository.create({
      ...condicionDto,
      regla,
    });

    return this.condicionesReglasRepository.save(nuevaCondicion);
  }

  // Obtener todas las condiciones
  async findAll(): Promise<CondicionesReglas[]> {
    return this.condicionesReglasRepository.find({ relations: ['regla'] });
  }

  // Obtener una condición por ID
  async findOne(id: number): Promise<CondicionesReglas> {
    const condicion = await this.condicionesReglasRepository.findOne({
      where: { CondicionID: id },
      relations: ['regla'],
    });
    if (!condicion) {
      throw new HttpException('Condición no encontrada', HttpStatus.NOT_FOUND);
    }
    return condicion;
  }

  // Actualizar una condición
  async update(
    id: number,
    condicion: Partial<CondicionesReglas>,
  ): Promise<CondicionesReglas> {
    const condicionExistente = await this.findOne(id);
    if (!condicionExistente) {
      throw new HttpException('Condición no encontrada', HttpStatus.NOT_FOUND);
    }
    await this.condicionesReglasRepository.update(id, condicion);
    return this.findOne(id);
  }

  // Eliminar una condición
  async remove(id: number): Promise<void> {
    const condicion = await this.findOne(id);
    if (!condicion) {
      throw new HttpException('Condición no encontrada', HttpStatus.NOT_FOUND);
    }
    await this.condicionesReglasRepository.delete(id);
  }
}
