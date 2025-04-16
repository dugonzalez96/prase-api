import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  HttpException,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { PolizasService } from './polizas.service';
import { CreatePolizaDto } from './dto/create-poliza.dto';
import { UpdatePolizaDto } from './dto/update-poliza.dto';

@Controller('polizas')
export class PolizasController {
  constructor(private readonly polizasService: PolizasService) {}

  @Post()
  create(@Body() createPolizaDto: CreatePolizaDto) {
    return this.polizasService.create(createPolizaDto);
  }

  @Get()
  findAll() {
    return this.polizasService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.polizasService.findOne(id);
  }

  @Patch(':id/:usuario')
  update(
    @Param('id') id: number,
    @Param('usuario') usuario: string,
    @Body() updatePolizaDto: UpdatePolizaDto,
  ) {
    return this.polizasService.update(id, updatePolizaDto, usuario);
  }

  @Delete(':id/:usuario')
  remove(
    @Param('id') id: number,
    @Param('usuario') usuario: string,
    @Body('motivo') motivo?: string,
  ) {
    return this.polizasService.remove(id, usuario, motivo);
  }

  @Get('esquema-pagos/:folio')
  async generarEsquemaPagos(@Param('folio') folio: string) {
    if (!folio) {
      throw new HttpException(
        'Debe proporcionar un Folio de póliza',
        HttpStatus.BAD_REQUEST,
      );
    } 
    // Llamar al servicio con el folio
    return this.polizasService.generarEsquemaPagos({ folio });
  }
  
  
  
}
