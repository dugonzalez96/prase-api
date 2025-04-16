
// Service: EmpleadoService
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateEmpleadoDto, UpdateEmpleadoDto } from './dto/empleado.dto';
import { TipoEmpleado } from 'src/tipo-empleado/entities/tipo-empleado.entity';
import { Empleado } from './entity/empleado.entity';

@Injectable()
export class EmpleadoService {
  constructor(
    @InjectRepository(Empleado, 'db1')
    private readonly empleadoRepository: Repository<Empleado>,

    @InjectRepository(TipoEmpleado, 'db1')
    private readonly tipoEmpleadoRepository: Repository<TipoEmpleado>,
  ) {}

  async findAll(): Promise<Empleado[]> {
    return await this.empleadoRepository.find({ relations: ['TipoEmpleado'] });
  }

  async findOne(id: number): Promise<Empleado> {
    const empleado = await this.empleadoRepository.findOne({ where: { EmpleadoID: id }, relations: ['TipoEmpleado'] });
    if (!empleado) {
      throw new HttpException('Empleado no encontrado', HttpStatus.NOT_FOUND);
    }
    return empleado;
  }

  async create(createEmpleadoDto: CreateEmpleadoDto): Promise<Empleado> {
    const tipoEmpleado = await this.tipoEmpleadoRepository.findOne({ where: { TipoEmpleadoID: createEmpleadoDto.TipoEmpleadoID } });
    if (!tipoEmpleado) {
      throw new HttpException('TipoEmpleado no encontrado', HttpStatus.BAD_REQUEST);
    }

    const nuevoEmpleado = this.empleadoRepository.create({
      ...createEmpleadoDto,
      TipoEmpleado: tipoEmpleado,
    });

    return await this.empleadoRepository.save(nuevoEmpleado);
  }

  async update(id: number, updateEmpleadoDto: UpdateEmpleadoDto): Promise<Empleado> {
    const empleado = await this.findOne(id);

    const tipoEmpleado = await this.tipoEmpleadoRepository.findOne({ where: { TipoEmpleadoID: updateEmpleadoDto.TipoEmpleadoID } });
    if (!tipoEmpleado) {
      throw new HttpException('TipoEmpleado no encontrado', HttpStatus.BAD_REQUEST);
    }

    Object.assign(empleado, updateEmpleadoDto, { TipoEmpleado: tipoEmpleado });
    return await this.empleadoRepository.save(empleado);
  }

  async remove(id: number): Promise<string> {
    const empleado = await this.findOne(id);
    await this.empleadoRepository.remove(empleado);
    return `Empleado con ID ${id} eliminado exitosamente.`;
  }
}