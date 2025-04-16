import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BitacoraEdiciones } from './bitacora-ediciones.entity';

@Injectable()
export class BitacoraEdicionesService {
  constructor(
    @InjectRepository(BitacoraEdiciones, 'db1')
    private readonly bitacoraEdicionesRepository: Repository<BitacoraEdiciones>,
  ) { }

  async registrarEdicion(
    entidad: string,
    entidadID: number,
    camposModificados: Record<string, any>,
    usuario: string,
  ): Promise<void> {
    await this.bitacoraEdicionesRepository.save({
      Entidad: entidad,
      EntidadID: entidadID,
      CamposModificados: camposModificados,
      FechaEdicion: new Date(),
      UsuarioEdicion: usuario,
    });
  }
}
