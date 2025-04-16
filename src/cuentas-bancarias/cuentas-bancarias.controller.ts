import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CuentasBancariasService } from './cuentas-bancarias.service';
import { CreateCuentasBancariasDto } from './dto/create-cuentas-bancarias.dto';
import { UpdateCuentasBancariasDto } from './dto/update-cuentas-bancarias.dto';

@Controller('cuentas-bancarias')
export class CuentasBancariasController {
  constructor(private readonly cuentasBancariasService: CuentasBancariasService) {}

  @Get()
  findAll() {
    return this.cuentasBancariasService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.cuentasBancariasService.findOne(id);
  }

  @Post()
  create(@Body() createDto: CreateCuentasBancariasDto) {
    return this.cuentasBancariasService.create(createDto);
  }

  @Patch(':id')
  update(@Param('id') id: number, @Body() updateDto: UpdateCuentasBancariasDto) {
    return this.cuentasBancariasService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.cuentasBancariasService.remove(id);
  }
}
