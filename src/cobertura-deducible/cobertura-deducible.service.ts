import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cobertura_Deducible } from './cobertura-deducible.entity';

@Injectable()
export class CoberturaDeducibleService {
  constructor(
    @InjectRepository(Cobertura_Deducible, 'db1')  // Si usas múltiples conexiones, 'db1' está bien
    private readonly coberturaDeducibleRepository: Repository<Cobertura_Deducible>,
  ) { }
  // Crear la asociación entre una cobertura y deducibles
  async createAssociation(coberturaId: number, deducibleId: number): Promise<Cobertura_Deducible> {
    const nuevaAsociacion = this.coberturaDeducibleRepository.create({
      cobertura: { CoberturaID: coberturaId },
      deducible: { DeducibleID: deducibleId },
    });
    return this.coberturaDeducibleRepository.save(nuevaAsociacion);
  }

  // Obtener todas las asociaciones
  async findAll(): Promise<Cobertura_Deducible[]> {
    return this.coberturaDeducibleRepository.find({
      relations: ['cobertura', 'deducible'],  // Cargar los datos relacionados
    });
  }

  // Eliminar una asociación por ID
  async remove(id: number): Promise<void> {
    await this.coberturaDeducibleRepository.delete(id);
  }
}