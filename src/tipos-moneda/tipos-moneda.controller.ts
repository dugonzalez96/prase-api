import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TiposMonedaService } from './tipos-moneda.service';
import { CreateTipoMonedaDto } from './dto/create-tipo-moneda.dto';
import { UpdateTipoMonedaDto } from './dto/update-tipo-moneda.dto';

@Controller('tipos-moneda')
export class TiposMonedaController {
  constructor(private readonly tiposMonedaService: TiposMonedaService) {}

  @Post()
  create(@Body() createTipoMonedaDto: CreateTipoMonedaDto) {
    return this.tiposMonedaService.create(createTipoMonedaDto);
  }

  @Get()
  findAll() {
    return this.tiposMonedaService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tiposMonedaService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTipoMonedaDto: UpdateTipoMonedaDto) {
    return this.tiposMonedaService.update(+id, updateTipoMonedaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tiposMonedaService.remove(+id);
  }
}
