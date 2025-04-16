import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { DocumentosRequeridosService } from './documentos-requeridos.service';
import { CreateDocumentosRequeridosDto } from './dto/documentos-requeridos.dto';

@Controller('documentos-requeridos')
export class DocumentosRequeridosController {
  constructor(private readonly service: DocumentosRequeridosService) {}

  @Post()
  create(@Body() createDto: CreateDocumentosRequeridosDto) {
    return this.service.create(createDto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.service.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.service.remove(id);
  }
}
