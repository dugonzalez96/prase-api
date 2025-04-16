import {
    Controller,
    Post,
    Patch,
    Delete,
    Param,
    Body,
    Get,
    HttpException,
    HttpStatus,
  } from '@nestjs/common';
  import { DocumentosDigitalizadosService } from './documentos-digitalizados.service';
  import { CreateDocumentosDigitalizadosDto } from './dto/documentos-digitalizados.dto';
  
  @Controller('documentos-digitalizados')
  export class DocumentosDigitalizadosController {
    constructor(private readonly documentosDigitalizadosService: DocumentosDigitalizadosService) {}
  
    @Post('upload')
    async upload(@Body() createDto: CreateDocumentosDigitalizadosDto) {
      try {
        return await this.documentosDigitalizadosService.upload(createDto);
      } catch (error) {
        throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
      }
    }
  
    @Patch(':id')
    async update(
      @Param('id') id: number,
      @Body() updateDto: CreateDocumentosDigitalizadosDto,
    ) {
      try {
        return await this.documentosDigitalizadosService.updateDocumento(id, updateDto);
      } catch (error) {
        throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
      }
    }
  
    @Delete(':id')
    async delete(@Param('id') id: number) {
      try {
        return await this.documentosDigitalizadosService.deleteDocumento(id);
      } catch (error) {
        throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
      }
    }
  
    @Get('poliza/:polizaId')
    async getByPolizaId(@Param('polizaId') polizaId: number) {
      try {
        return await this.documentosDigitalizadosService.getDocumentosByPolizaId(polizaId);
      } catch (error) {
        throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
      }
    }
  }
  