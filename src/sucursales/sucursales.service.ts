import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sucursal } from './entities/sucursales.entity';
import { CreateSucursalDto } from './dto/create-sucursal.dto';
import { UpdateSucursalDto } from './dto/update-sucursal.dto';

@Injectable()
export class SucursalesService {
  constructor(
    @InjectRepository(Sucursal,'db1')
    private readonly sucursalesRepository: Repository<Sucursal>,
  ) {}

  async findAll(): Promise<Sucursal[]> {
    return await this.sucursalesRepository.find();
  }

  async findOne(id: number): Promise<Sucursal> {
    const sucursal = await this.sucursalesRepository.findOne({ where: { SucursalID: id } });
    if (!sucursal) {
      throw new HttpException('Sucursal no encontrada', HttpStatus.NOT_FOUND);
    }
    return sucursal;
  }

  async create(createDto: CreateSucursalDto): Promise<Sucursal> {
    const nuevaSucursal = this.sucursalesRepository.create(createDto);
    return await this.sucursalesRepository.save(nuevaSucursal);
  }

  async update(id: number, updateDto: UpdateSucursalDto): Promise<Sucursal> {
    const sucursal = await this.findOne(id);
    Object.assign(sucursal, updateDto);
    return await this.sucursalesRepository.save(sucursal);
  }

  async remove(id: number): Promise<string> {
    const sucursal = await this.findOne(id);
    await this.sucursalesRepository.remove(sucursal);
    return `Sucursal con ID ${id} eliminada exitosamente.`;
  }
}
