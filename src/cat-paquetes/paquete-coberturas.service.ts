import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaqueteCoberturas } from './paquete-coberturas.entity';
import { BitacoraEliminacionesService } from '../bitacora-eliminaciones/bitacora-eliminaciones.service';  // Importa el servicio de la bitácora
import { BitacoraEdicionesService } from '../bitacora-ediciones/bitacora-ediciones.service';  // Importa el servicio de la bitácora

@Injectable()
export class PaqueteCoberturasService {
  constructor(
    @InjectRepository(PaqueteCoberturas, 'db1')  // Si usas múltiples conexiones, 'db1' está bien
    private paqueteCoberturasRepository: Repository<PaqueteCoberturas>,
    private bitacoraEliminacionesService: BitacoraEliminacionesService,
    private bitacoraEdicionesService: BitacoraEdicionesService
  ) { }

  async create(paquete: PaqueteCoberturas): Promise<PaqueteCoberturas> {
    return this.paqueteCoberturasRepository.save(paquete);
  }

  async findAll(): Promise<PaqueteCoberturas[]> {
    return this.paqueteCoberturasRepository.find();
  }

  async findOne(id: number): Promise<PaqueteCoberturas> {
    const paquete = await this.paqueteCoberturasRepository.findOne({
      where: { PaqueteCoberturaID: id },
    });

    if (!paquete) {
      throw new HttpException('PaqueteCoberturas not found', HttpStatus.NOT_FOUND);
    }

    return paquete;
  }

  async update(id: number, paquete: Partial<PaqueteCoberturas>, usuario: string): Promise<PaqueteCoberturas> {
    const paqueteExistente = await this.findOne(id);
  
    if (!paqueteExistente) {
      throw new HttpException('PaqueteCoberturas not found', HttpStatus.NOT_FOUND);
    }
  
    // Realiza la actualización
    await this.paqueteCoberturasRepository.update(id, paquete);
  
    // Calcula los campos modificados
    const camposModificados = {};
    for (const key in paquete) {
      if (paquete[key] !== paqueteExistente[key]) {
        camposModificados[key] = {
          anterior: paqueteExistente[key],
          nuevo: paquete[key],
        };
      }
    }
  
    // Registrar la edición en la bitácora
    if (Object.keys(camposModificados).length > 0) {
      await this.bitacoraEdicionesService.registrarEdicion(
        'PaqueteCoberturas',
        id,
        camposModificados,
        usuario,
      );
    }
  
    return this.findOne(id);
  }

  async remove(id: number, usuario: string, motivo?: string): Promise<void> {
    // Usa el método findOne para buscar el paquete
    const paquete = await this.findOne(id);  // No hace falta repetir el código, usa el método existente
  
    // Elimina el paquete
    await this.paqueteCoberturasRepository.delete(id);
  
    // Registra la eliminación en la bitácora
    await this.bitacoraEliminacionesService.registrarEliminacion(
      'PaqueteCoberturas', id, usuario, motivo
    );
  }
  
}
