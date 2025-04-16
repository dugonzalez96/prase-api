import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BitacoraEliminaciones } from './bitacora-eliminaciones.entity';

@Injectable()
export class BitacoraEliminacionesService {
  constructor(
    @InjectRepository(BitacoraEliminaciones, 'db1') 
    private readonly bitacoraEliminacionesRepository: Repository<BitacoraEliminaciones>,
  ) {}

  async registrarEliminacion(
    entidad: string, 
    entidadID: number, 
    usuario: string, 
    motivo?: string
  ): Promise<void> {
    await this.bitacoraEliminacionesRepository.save({
      Entidad: entidad,
      EntidadID: entidadID,
      FechaEliminacion: new Date(),
      UsuarioEliminacion: usuario,
      MotivoEliminacion: motivo || 'No especificado',
    });
  }
}
