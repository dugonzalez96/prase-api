import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TipoEmpleado } from './entities/tipo-empleado.entity';


@Injectable()
export class TipoEmpleadoService {
  constructor(
    @InjectRepository(TipoEmpleado,'db1')
    private readonly tipoEmpleadoRepository: Repository<TipoEmpleado>,
  ) {}

  async findAll(): Promise<TipoEmpleado[]> {
    return await this.tipoEmpleadoRepository.find();
  }

  async findOne(id: number): Promise<TipoEmpleado> {
    return await this.tipoEmpleadoRepository.findOne({ where: { TipoEmpleadoID: id } });
  }
}
