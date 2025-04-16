import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { CondicionesReglasService } from './condiciones-reglas.service';
import { CondicionesReglas } from './condiciones-reglas.entity';
import CreateCondicionReglaDto from './dto/create-condicion-regla.dto';

@Controller('condiciones-reglas')
export class CondicionesReglasController {
  constructor(private readonly condicionesReglasService: CondicionesReglasService) { }

  @Get()
  findAll(): Promise<CondicionesReglas[]> {
    return this.condicionesReglasService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number): Promise<CondicionesReglas> {
    return this.condicionesReglasService.findOne(id);
  }

  @Post()
  async create(@Body() condicionDto: CreateCondicionReglaDto): Promise<CondicionesReglas> {
    return this.condicionesReglasService.create(condicionDto);
  }

  @Patch(':id')
  update(@Param('id') id: number, @Body() condicion: Partial<CondicionesReglas>): Promise<CondicionesReglas> {
    return this.condicionesReglasService.update(id, condicion);
  }

  @Delete(':id')
  remove(@Param('id') id: number): Promise<void> {
    return this.condicionesReglasService.remove(id);
  }
}
