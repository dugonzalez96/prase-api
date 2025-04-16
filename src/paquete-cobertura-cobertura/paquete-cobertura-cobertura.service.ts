import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaqueteCobertura_Cobertura } from './paquete-cobertura-cobertura.entity';
import { BitacoraEliminacionesService } from '../bitacora-eliminaciones/bitacora-eliminaciones.service';
import { BitacoraEdicionesService } from '../bitacora-ediciones/bitacora-ediciones.service';

@Injectable()
export class PaqueteCobertura_CoberturaService {
  constructor(
    @InjectRepository(PaqueteCobertura_Cobertura, 'db1')  // Si usas múltiples conexiones, 'db1' está bien
    private readonly paqueteCoberturaRepo: Repository<PaqueteCobertura_Cobertura>,
    private readonly bitacoraEliminacionesService: BitacoraEliminacionesService,
    private readonly bitacoraEdicionesService: BitacoraEdicionesService,
  ) { }
  // Crear la asociación entre un paquete y coberturas, donde cada cobertura puede ser obligatoria o no
  async createAssociation(paqueteCoberturaId: number, coberturasData: { CoberturaID: number, obligatoria: boolean }[]): Promise<PaqueteCobertura_Cobertura[]> {
    const asociaciones: PaqueteCobertura_Cobertura[] = [];

    for (const coberturaData of coberturasData) {
      const asociacion = this.paqueteCoberturaRepo.create({
        PaqueteCoberturaID: paqueteCoberturaId,
        CoberturaID: coberturaData.CoberturaID,
        Obligatoria: coberturaData.obligatoria,  // Cada cobertura tiene su propio valor de obligatoria
        FechaAsociacion: new Date(),
      });
      const savedAssociation = await this.paqueteCoberturaRepo.save(asociacion);
      asociaciones.push(savedAssociation);  // Agregar la asociación guardada al array
    }
    // Devuelve todas las asociaciones creadas, incluyendo relaciones
    return this.paqueteCoberturaRepo.find({
      where: { PaqueteCoberturaID: paqueteCoberturaId },
      relations: ['paquete', 'cobertura'],  // Incluye las relaciones con los detalles del paquete y cobertura
    });
  }

  // Actualizar asociaciones y registrar en bitácora de ediciones
  async updateAssociation(paqueteCoberturaId: number, coberturasData: { CoberturaID: number, obligatoria: boolean }[], usuario: string): Promise<{ message: string }> {
    const asociacionesPrevias = await this.paqueteCoberturaRepo.find({
      where: { PaqueteCoberturaID: paqueteCoberturaId },
    });

    // Realiza la actualización
    await this.createAssociation(paqueteCoberturaId, coberturasData);

    // Registra la actualización en la bitácora
    await this.bitacoraEdicionesService.registrarEdicion(
      'PaqueteCobertura_Cobertura',
      paqueteCoberturaId,
      { asociacionAnterior: asociacionesPrevias, nuevasCoberturas: coberturasData },
      usuario,
    );

    // Retorna un mensaje indicando que la actualización fue exitosa
    return { message: `Asociaciones actualizadas correctamente para el paquete ${paqueteCoberturaId}.` };
  }


  // Método para eliminar asociaciones específicas entre un paquete y coberturas y registrar en bitácora
  async removeAssociation(paqueteCoberturaId: number, coberturaIds: number[], usuario: string): Promise<void> {
    for (const coberturaId of coberturaIds) {
      const result = await this.paqueteCoberturaRepo.delete({
        PaqueteCoberturaID: paqueteCoberturaId,
        CoberturaID: coberturaId,
      });

      if (result.affected > 0) {
        // Registra la eliminación en la bitácora
        await this.bitacoraEliminacionesService.registrarEliminacion(
          'PaqueteCobertura_Cobertura',
          paqueteCoberturaId,
          usuario,
          `Se eliminó la cobertura con ID ${coberturaId} del paquete ${paqueteCoberturaId}`,
        );
      } else {
        throw new HttpException(
          `No se encontró la asociación entre el paquete ${paqueteCoberturaId} y la cobertura ${coberturaId}`,
          HttpStatus.NOT_FOUND,
        );
      }
    }
  }

  // Eliminar todas las asociaciones de un paquete y registrar en bitácora
  async removeAllAssociations(paqueteCoberturaId: number, usuario: string): Promise<void> {
    const asociaciones = await this.paqueteCoberturaRepo.find({
      where: { PaqueteCoberturaID: paqueteCoberturaId },
    });

    if (asociaciones.length === 0) {
      throw new HttpException(
        `No se encontraron asociaciones para el paquete ${paqueteCoberturaId}`,
        HttpStatus.NOT_FOUND,
      );
    }

    // Elimina todas las asociaciones del paquete
    await this.paqueteCoberturaRepo.delete({ PaqueteCoberturaID: paqueteCoberturaId });

    // Registra la eliminación en la bitácora
    await this.bitacoraEliminacionesService.registrarEliminacion(
      'PaqueteCobertura_Cobertura',
      paqueteCoberturaId,
      usuario,
      `Se eliminaron todas las coberturas del paquete ${paqueteCoberturaId}`,
    );
  }

  // Obtener todas las asociaciones
  async findAll() {
    return this.paqueteCoberturaRepo.find();
  }
}



