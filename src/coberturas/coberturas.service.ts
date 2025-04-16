import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Coberturas } from './coberturas.entity';
import { TiposDeducible } from '../tipos-deducible/tipos-deducible.entity';
import { TiposMoneda } from '../tipos-moneda/tipos-moneda.entity';
import { BitacoraEliminacionesService } from '../bitacora-eliminaciones/bitacora-eliminaciones.service';
import { BitacoraEdicionesService } from '../bitacora-ediciones/bitacora-ediciones.service';

@Injectable()
export class CoberturasService {
  constructor(
    @InjectRepository(Coberturas, 'db1')
    private readonly coberturasRepository: Repository<Coberturas>,
    @InjectRepository(TiposDeducible, 'db1')
    private readonly tiposDeducibleRepository: Repository<TiposDeducible>,
    @InjectRepository(TiposMoneda, 'db1')
    private readonly tiposMonedaRepository: Repository<TiposMoneda>,
    private readonly bitacoraEliminacionesService: BitacoraEliminacionesService,
    private readonly bitacoraEdicionesService: BitacoraEdicionesService,
  ) { }

  async create(cobertura: Partial<Coberturas>): Promise<Coberturas> {
    // Validar que el tipo de deducible existe si fue proporcionado
    if (cobertura.tipoDeducible) {
      const tipoDeducible = await this.tiposDeducibleRepository.findOne({
        where: { TipoDeducibleID: cobertura.tipoDeducible.TipoDeducibleID },
      });
      if (!tipoDeducible) {
        throw new HttpException('Tipo de Deducible no encontrado', HttpStatus.NOT_FOUND);
      }
      cobertura.tipoDeducible = tipoDeducible;
    }

    // Validar que el tipo de moneda existe si fue proporcionado
    if (cobertura.tipoMoneda) {
      const tipoMoneda = await this.tiposMonedaRepository.findOne({
        where: { TipoMonedaID: cobertura.tipoMoneda.TipoMonedaID },
      });
      if (!tipoMoneda) {
        throw new HttpException('Tipo de Moneda no encontrado', HttpStatus.NOT_FOUND);
      }
      cobertura.tipoMoneda = tipoMoneda;
    }

    // Crear la cobertura
    return this.coberturasRepository.save(cobertura);
  }

  async findAll(): Promise<Coberturas[]> {
    return this.coberturasRepository.find({
      relations: ['tipoDeducible', 'tipoMoneda'], // Incluir las relaciones
    });
  }

  async findOne(id: number): Promise<Coberturas> {
    const cobertura = await this.coberturasRepository.findOne({
      where: { CoberturaID: id },
      relations: ['tipoDeducible', 'tipoMoneda'], // Incluir las relaciones
    });

    if (!cobertura) {
      throw new HttpException('Cobertura no encontrada', HttpStatus.NOT_FOUND);
    }

    return cobertura;
  }

  async update(id: number, cobertura: Partial<Coberturas>, usuario: string): Promise<Coberturas> {
    const coberturaExistente = await this.findOne(id);

    if (!coberturaExistente) {
      throw new HttpException('Cobertura no encontrada', HttpStatus.NOT_FOUND);
    }

    // Validar y asignar tipo de deducible si fue proporcionado
    if (cobertura.tipoDeducible) {
      const tipoDeducible = await this.tiposDeducibleRepository.findOne({
        where: { TipoDeducibleID: cobertura.tipoDeducible.TipoDeducibleID },
      });
      if (!tipoDeducible) {
        throw new HttpException('Tipo de Deducible no encontrado', HttpStatus.NOT_FOUND);
      }
      cobertura.tipoDeducible = tipoDeducible; // Asignar al objeto parcial
    }

    // Validar y asignar tipo de moneda si fue proporcionado
    if (cobertura.tipoMoneda) {
      const tipoMoneda = await this.tiposMonedaRepository.findOne({
        where: { TipoMonedaID: cobertura.tipoMoneda.TipoMonedaID },
      });
      if (!tipoMoneda) {
        throw new HttpException('Tipo de Moneda no encontrado', HttpStatus.NOT_FOUND);
      }
      cobertura.tipoMoneda = tipoMoneda; // Asignar al objeto parcial
    }

    // Mezclar datos de coberturaExistente con los nuevos valores
    const coberturaActualizada = Object.assign(coberturaExistente, cobertura);

    console.log(coberturaActualizada);

    // Actualizar cobertura
    await this.coberturasRepository.save(coberturaActualizada);

    // Comparar cambios para la bitácora
    const camposModificados = {};
    for (const key in cobertura) {
      if (cobertura[key] !== coberturaExistente[key]) {
        camposModificados[key] = {
          anterior: coberturaExistente[key],
          nuevo: cobertura[key],
        };
      }
    }

    // Registrar en la bitácora si hubo cambios
    if (Object.keys(camposModificados).length > 0) {
      await this.bitacoraEdicionesService.registrarEdicion(
        'Coberturas',
        id,
        camposModificados,
        usuario,
      );
    }

    return this.findOne(id); // Devolver la cobertura actualizada
  }


  async remove(id: number, usuario: string, motivo?: string): Promise<void> {
    const cobertura = await this.findOne(id);

    if (!cobertura) {
      throw new HttpException('Cobertura no encontrada', HttpStatus.NOT_FOUND);
    }

    // Eliminar la cobertura
    await this.coberturasRepository.delete(id);

    // Registrar en la bitácora de eliminaciones
    await this.bitacoraEliminacionesService.registrarEliminacion(
      'Coberturas',
      id,
      usuario,
      motivo,
    );
  }
}
