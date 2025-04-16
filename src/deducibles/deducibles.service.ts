import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Deducibles } from './deducibles.entity';

@Injectable()
export class DeduciblesService  {
  constructor(
    @InjectRepository(Deducibles, 'db1')  // Si usas múltiples conexiones, 'db1' está bien
    private readonly deduciblesRepository: Repository<Deducibles>,
  ) { }

// Crear un deducible
async create(deducible: Deducibles): Promise<Deducibles> {
  return this.deduciblesRepository.save(deducible);
}

// Obtener todos los deducibles
async findAll(): Promise<Deducibles[]> {
  return this.deduciblesRepository.find();
}

// Obtener un deducible por ID
async findOne(id: number): Promise<Deducibles> {
  const deducible = await this.deduciblesRepository.findOne({ where: { DeducibleID: id } });
  if (!deducible) {
    throw new HttpException('Deducible not found', HttpStatus.NOT_FOUND);
  }
  return deducible;
}

// Actualizar un deducible
async update(id: number, deducible: Partial<Deducibles>): Promise<Deducibles> {
  const deducibleExistente = await this.findOne(id);
  if (!deducibleExistente) {
    throw new HttpException('Deducible not found', HttpStatus.NOT_FOUND);
  }
  await this.deduciblesRepository.update(id, deducible);
  return this.findOne(id);  // Devuelve el deducible actualizado
}

// Eliminar un deducible
async remove(id: number): Promise<void> {
  const deducibleExistente = await this.findOne(id);
  if (!deducibleExistente) {
    throw new HttpException('Deducible not found', HttpStatus.NOT_FOUND);
  }
  await this.deduciblesRepository.delete(id);
}
}