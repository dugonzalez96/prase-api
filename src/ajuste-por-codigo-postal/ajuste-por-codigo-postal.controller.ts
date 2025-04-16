import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AjustePorCodigoPostalService } from './ajuste-por-codigo-postal.service';
import { CreateAjustePorCodigoPostalDto } from './dto/create-ajuste-por-codigo-postal.dto';
import { UpdateAjustePorCodigoPostalDto } from './dto/update-ajuste-por-codigo-postal.dto';


@Controller('ajuste-por-codigo-postal')
export class AjustePorCodigoPostalController {
  constructor(private readonly service: AjustePorCodigoPostalService) {}

  @Post()
  async create(@Body() dto: CreateAjustePorCodigoPostalDto) {
    return await this.service.create(dto);
  }

  @Get()
  async findAll() {
    return await this.service.findAll();
  }

  @Get(':codigoPostal')
  async findOne(@Param('codigoPostal') codigoPostal: string) {
    return await this.service.findOne(codigoPostal);
  }

  @Patch(':codigoPostal')
  async update(@Param('codigoPostal') codigoPostal: string, @Body() dto: UpdateAjustePorCodigoPostalDto) {
    return await this.service.update(codigoPostal, dto);
  }

  @Delete(':codigoPostal')
  async remove(@Param('codigoPostal') codigoPostal: string) {
    return await this.service.remove(codigoPostal);
  }
}
