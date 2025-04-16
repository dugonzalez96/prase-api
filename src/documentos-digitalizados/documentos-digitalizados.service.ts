import * as fs from 'fs';
import * as path from 'path';
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentosDigitalizados } from './entities/documentos-digitalizados.entity';
import { DocumentosRequeridos } from 'src/documentos-requeridos/entities/documentos-requeridos.entity';
import { Poliza } from 'src/polizas/entities/poliza.entity';
import { CreateDocumentosDigitalizadosDto } from './dto/documentos-digitalizados.dto';

@Injectable()
export class DocumentosDigitalizadosService {
  constructor(
    @InjectRepository(DocumentosDigitalizados, 'db1')
    private readonly documentosDigitalizadosRepository: Repository<DocumentosDigitalizados>,
    @InjectRepository(Poliza, 'db1')
    private readonly polizasRepository: Repository<Poliza>,
    @InjectRepository(DocumentosRequeridos, 'db1')
    private readonly documentosRequeridosRepository: Repository<DocumentosRequeridos>,
  ) {}
  async upload(
    createDto: CreateDocumentosDigitalizadosDto,
  ): Promise<DocumentosDigitalizados> {
    const { Base64, PolizaID, DocumentoID, EstadoDocumento } = createDto;

    // Validar que el Base64 esté presente
    if (!Base64) {
      throw new HttpException(
        'Archivo en base64 es obligatorio',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Extraer el tipo de archivo desde el Base64
    const matches = Base64.match(/^data:(.+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new HttpException(
        'Formato de archivo inválido',
        HttpStatus.BAD_REQUEST,
      );
    }

    const fileType = matches[1]; // Ejemplo: 'image/png' o 'application/pdf'
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    // Validar tamaño del archivo
    if (buffer.length > 2 * 1024 * 1024) {
      throw new HttpException(
        'El archivo supera el límite de 2 MB',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validar existencia de la póliza
    const poliza = await this.polizasRepository.findOne({
      where: { PolizaID },
    });
    if (!poliza) {
      throw new HttpException('Póliza no encontrada', HttpStatus.BAD_REQUEST);
    }

    // Validar existencia del documento requerido
    const documento = await this.documentosRequeridosRepository.findOne({
      where: { DocumentoID },
    });
    if (!documento) {
      throw new HttpException(
        'Documento requerido no encontrado',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Guardar el archivo en el sistema de archivos
    const extension = fileType.split('/')[1]; // Ejemplo: 'png' o 'pdf'
    const fileName = `${DocumentoID}_${Date.now()}.${extension}`;
    const uploadsDir = path.join(__dirname, '../../uploads/');

    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filePath = path.join(uploadsDir, fileName);
    fs.writeFileSync(filePath, buffer);

    // Crear y guardar el registro en la base de datos
    const nuevoDocumento = this.documentosDigitalizadosRepository.create({
      Poliza: poliza,
      Documento: documento,
      RutaArchivo: filePath,
      FechaCarga: new Date(),
      EstadoDocumento,
    });

    return await this.documentosDigitalizadosRepository.save(nuevoDocumento);
  }

  async deleteDocumento(id: number): Promise<string> {
    const documento = await this.documentosDigitalizadosRepository.findOne({
      where: { DocumentoDigitalizadoID: id },
    });

    if (!documento) {
      throw new HttpException('Documento no encontrado', HttpStatus.NOT_FOUND);
    }

    // Eliminar físicamente el archivo del sistema de archivos
    if (fs.existsSync(documento.RutaArchivo)) {
      fs.unlinkSync(documento.RutaArchivo);
    }

    // Eliminar el registro de la base de datos
    await this.documentosDigitalizadosRepository.delete(id);

    return `Documento con ID ${id} eliminado exitosamente.`;
  }
  async updateDocumento(
    id: number,
    updateDto: CreateDocumentosDigitalizadosDto,
  ): Promise<DocumentosDigitalizados> {
    const documento = await this.documentosDigitalizadosRepository.findOne({
      where: { DocumentoDigitalizadoID: id },
    });

    if (!documento) {
      throw new HttpException('Documento no encontrado', HttpStatus.NOT_FOUND);
    }

    const { Base64, EstadoDocumento } = updateDto;

    // Si se envía un nuevo archivo Base64, procesarlo
    if (Base64) {
      const matches = Base64.match(/^data:(.+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        throw new HttpException(
          'Formato de archivo inválido',
          HttpStatus.BAD_REQUEST,
        );
      }

      const fileType = matches[1];
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, 'base64');

      if (buffer.length > 2 * 1024 * 1024) {
        throw new HttpException(
          'El archivo supera el límite de 2 MB',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Eliminar el archivo antiguo
      if (fs.existsSync(documento.RutaArchivo)) {
        fs.unlinkSync(documento.RutaArchivo);
      }

      // Guardar el nuevo archivo en el sistema de archivos
      const extension = fileType.split('/')[1];
      const fileName = `${documento.Documento.DocumentoID}_${Date.now()}.${extension}`;
      const uploadsDir = path.join(__dirname, '../../uploads/');

      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const filePath = path.join(uploadsDir, fileName);
      fs.writeFileSync(filePath, buffer);

      documento.RutaArchivo = filePath;
    }

    // Actualizar el estado del documento si es necesario
    if (EstadoDocumento) {
      documento.EstadoDocumento = EstadoDocumento;
    }

    // Guardar los cambios
    return await this.documentosDigitalizadosRepository.save(documento);
  }

  async getDocumentosByPolizaId(
    polizaId: number,
  ): Promise<DocumentosDigitalizados[]> {
    const documentos = await this.documentosDigitalizadosRepository.find({
      where: { Poliza: { PolizaID: polizaId } },
      relations: ['Documento', 'Poliza'],
    });

    if (!documentos.length) {
      throw new HttpException(
        'No se encontraron documentos para esta póliza',
        HttpStatus.NOT_FOUND,
      );
    }

    return documentos;
  }
}
