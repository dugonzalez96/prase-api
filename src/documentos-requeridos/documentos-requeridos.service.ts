import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentosRequeridos } from './entities/documentos-requeridos.entity';
import { CreateDocumentosRequeridosDto } from './dto/documentos-requeridos.dto';


@Injectable()
export class DocumentosRequeridosService {
  constructor(
    @InjectRepository(DocumentosRequeridos,'db1')
    private readonly documentosRequeridosRepository: Repository<DocumentosRequeridos>,
  ) {}

  async create(createDto: CreateDocumentosRequeridosDto): Promise<DocumentosRequeridos> {
    const nuevoDocumento = this.documentosRequeridosRepository.create(createDto);
    return await this.documentosRequeridosRepository.save(nuevoDocumento);
  }

  async findAll(): Promise<DocumentosRequeridos[]> {
    return await this.documentosRequeridosRepository.find();
  }

  async findOne(id: number): Promise<DocumentosRequeridos> {
    return await this.documentosRequeridosRepository.findOne({ where: { DocumentoID: id } });
  }

  async remove(id: number): Promise<string> {
    await this.documentosRequeridosRepository.delete(id);
    return `Documento requerido con ID ${id} eliminado exitosamente.`;
  }
}
