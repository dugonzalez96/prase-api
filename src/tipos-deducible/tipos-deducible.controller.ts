import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TiposDeducibleService } from './tipos-deducible.service';
import { CreateTipoDeducibleDto } from './dto/create-tipo-deducible.dto';
import { UpdateTipoDeducibleDto } from './dto/update-tipo-deducible.dto';

@Controller('tipos-deducible')
export class TiposDeducibleController {
  constructor(private readonly tiposDeducibleService: TiposDeducibleService) {}

  @Post()
  create(@Body() createTipoDeducibleDto: CreateTipoDeducibleDto) {
    return this.tiposDeducibleService.create(createTipoDeducibleDto);
  }

  @Get()
  findAll() {
    return this.tiposDeducibleService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tiposDeducibleService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTipoDeducibleDto: UpdateTipoDeducibleDto) {
    return this.tiposDeducibleService.update(+id, updateTipoDeducibleDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tiposDeducibleService.remove(+id);
  }
}
