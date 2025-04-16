import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AplicacionReglas } from './aplicacion-reglas.entity';
@Injectable()
export class AplicacionReglasService {
  constructor(
    @InjectRepository(AplicacionReglas, 'db1')  // Si usas múltiples conexiones, 'db1' está bien
    private readonly aplicacionReglasRepository: Repository<AplicacionReglas>,
  ) { }

  // Crear una nueva aplicación de reglas
  async create(aplicacion: Partial<AplicacionReglas>): Promise<AplicacionReglas> {
    const nuevaAplicacion = this.aplicacionReglasRepository.create(aplicacion);
    return this.aplicacionReglasRepository.save(nuevaAplicacion);
  }

  // Obtener todas las aplicaciones de reglas
  async findAll(): Promise<AplicacionReglas[]> {
    //return this.aplicacionReglasRepository.find({ relations: ['ReglaID', 'CotizacionID', 'PolizaID'] });
    return this.aplicacionReglasRepository.find({ relations: ['ReglaID'] });
  }

  // Obtener una aplicación de reglas por ID
  async findOne(id: number): Promise<AplicacionReglas> {
    const aplicacion = await this.aplicacionReglasRepository.findOne({
      where: { AplicacionID: id },
      //relations: ['ReglaID', 'CotizacionID', 'PolizaID'],
      relations: ['ReglaID'],
    });

    if (!aplicacion) {
      throw new HttpException('Aplicación de reglas no encontrada', HttpStatus.NOT_FOUND);
    }

    return aplicacion;
  }
}