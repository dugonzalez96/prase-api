import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CuentasBancarias } from './entities/cuentas-bancarias.entity';
import { CreateCuentasBancariasDto } from './dto/create-cuentas-bancarias.dto';
import { UpdateCuentasBancariasDto } from './dto/update-cuentas-bancarias.dto';

@Injectable()
export class CuentasBancariasService {
  constructor(
    @InjectRepository(CuentasBancarias,'db1')
    private readonly cuentasBancariasRepository: Repository<CuentasBancarias>,
  ) {}

  async findAll(): Promise<CuentasBancarias[]> {
    return await this.cuentasBancariasRepository.find();
  }

  async findOne(id: number): Promise<CuentasBancarias> {
    const cuenta = await this.cuentasBancariasRepository.findOne({ where: { CuentaBancariaID: id } });
    if (!cuenta) {
      throw new HttpException('Cuenta bancaria no encontrada', HttpStatus.NOT_FOUND);
    }
    return cuenta;
  }

  async create(createDto: CreateCuentasBancariasDto): Promise<CuentasBancarias> {
    const nuevaCuenta = this.cuentasBancariasRepository.create(createDto);
    return await this.cuentasBancariasRepository.save(nuevaCuenta);
  }

  async update(id: number, updateDto: UpdateCuentasBancariasDto): Promise<CuentasBancarias> {
    const cuenta = await this.findOne(id);
    Object.assign(cuenta, updateDto);
    const actualizada = await this.cuentasBancariasRepository.save(cuenta);
    return actualizada;
  }

  async remove(id: number): Promise<string> {
    const cuenta = await this.findOne(id);
    await this.cuentasBancariasRepository.remove(cuenta);
    return `Cuenta bancaria con ID ${id} eliminada exitosamente.`;
  }
}
