import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { IniciosCajaService } from './inicios-caja.service';
import { CreateInicioCajaDto } from './dto/create-inicio-caja.dto';
import { UpdateInicioCajaDto } from './dto/update-inicio-caja.dto';

@Controller('inicios-caja')
export class IniciosCajaController {
  constructor(private readonly iniciosCajaService: IniciosCajaService) {}

  @Get()
  findAll() {
    return this.iniciosCajaService.findAll();
  }
  
  @Get('activo/:usuarioID')
  findActive(@Param('usuarioID') usuarioID: number) {
    return this.iniciosCajaService.findActive(usuarioID);
  }
  
  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.iniciosCajaService.findOne(id);
  }

  @Post()
  create(@Body() createDto: CreateInicioCajaDto) {
    return this.iniciosCajaService.create(createDto);
  }

  @Patch(':id')
  update(@Param('id') id: number, @Body() updateDto: UpdateInicioCajaDto) {
    return this.iniciosCajaService.update(id, updateDto);
  }

  @Delete(':id/:usuarioID')
  remove(
    @Param('id') id: number,
    @Param('usuarioID') usuarioID: number,
    @Body('motivo') motivo: string,
  ): Promise<string> {
    if (!motivo) {
      throw new HttpException(
        'El motivo de la eliminación es obligatorio',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.iniciosCajaService.remove(id, usuarioID, motivo);
  }
  
}
