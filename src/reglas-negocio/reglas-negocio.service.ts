import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReglasNegocio } from './reglas-negocio.entity';
import { CondicionesReglas } from 'src/condiciones-reglas/condiciones-reglas.entity';
import { Coberturas } from 'src/coberturas/coberturas.entity'; // Importamos la entidad Coberturas
import { TiposMoneda } from 'src/tipos-moneda/tipos-moneda.entity';

@Injectable()
export class ReglasNegocioService {
  constructor(
    @InjectRepository(ReglasNegocio, 'db1')
    private readonly reglasNegocioRepository: Repository<ReglasNegocio>,
    @InjectRepository(CondicionesReglas, 'db1')
    private readonly condicionesReglasRepository: Repository<CondicionesReglas>,
    @InjectRepository(Coberturas, 'db1') // Inyectamos el repositorio de Coberturas
    private readonly coberturasRepository: Repository<Coberturas>,
    @InjectRepository(TiposMoneda, 'db1')
    private readonly tiposMonedaRepository: Repository<TiposMoneda>,
  ) {}

  async create(regla: Partial<ReglasNegocio>): Promise<ReglasNegocio> {
    const nuevaRegla = this.reglasNegocioRepository.create(regla);
  
    // Validar y asociar la cobertura si se proporciona
    if (regla.cobertura && regla.cobertura.CoberturaID) {
      const cobertura = await this.coberturasRepository.findOne({
        where: { CoberturaID: regla.cobertura.CoberturaID },
      });
      if (!cobertura) {
        throw new HttpException('Cobertura no encontrada', HttpStatus.NOT_FOUND);
      }
      nuevaRegla.cobertura = cobertura;
    } else {
      nuevaRegla.cobertura = null;
    }
  
    // Validar y asignar el TipoMonedaID
    if (regla.TipoMonedaID) {
      const tipoMoneda = await this.tiposMonedaRepository.findOne({
        where: { TipoMonedaID: regla.TipoMonedaID },
      });
      if (!tipoMoneda) {
        throw new HttpException('Tipo de Moneda no encontrado', HttpStatus.NOT_FOUND);
      }
      nuevaRegla.TipoMonedaID = regla.TipoMonedaID;
    } else {
      nuevaRegla.TipoMonedaID = null;
    }
  
    // Asociar condiciones si se proporcionan
    if (regla.condiciones && regla.condiciones.length > 0) {
      nuevaRegla.condiciones = regla.condiciones.map((condicion) =>
        this.condicionesReglasRepository.create(condicion),
      );
    }
  
    return this.reglasNegocioRepository.save(nuevaRegla);
  }
  
  

  // Obtener Coberturas Accesorias basado en CoberturaEspecial
  async getCoberturasPorEspecial(especial: boolean): Promise<Coberturas[]> {
    return this.coberturasRepository.find({
      where: { EsCoberturaEspecial: especial },
    });
  }

  // Obtener Reglas Globales basado en EsGlobal
  async getReglasPorGlobal(global: boolean): Promise<ReglasNegocio[]> {
    return this.reglasNegocioRepository.find({
      where: { EsGlobal: global, Activa: true },
      relations: ['condiciones', 'cobertura'],
    });
  }
  // Obtener reglas de negocio dado un idCobertura
  async getReglasPorCobertura(idCobertura: number): Promise<ReglasNegocio[]> {
    return this.reglasNegocioRepository.find({
      where: { Activa: true, cobertura: { CoberturaID: idCobertura } },
      relations: ['condiciones', 'cobertura'],
    });
  }

  async update(
    id: number,
    regla: Partial<ReglasNegocio>,
    usuario: string,
  ): Promise<ReglasNegocio> {
    const reglaExistente = await this.findOne(id);
    if (!reglaExistente) {
      throw new HttpException('Regla de Negocio no encontrada', HttpStatus.NOT_FOUND);
    }
  
    // Validar y actualizar la cobertura si se proporciona
    if (regla.cobertura && regla.cobertura.CoberturaID) {
      const cobertura = await this.coberturasRepository.findOne({
        where: { CoberturaID: regla.cobertura.CoberturaID },
      });
      if (!cobertura) {
        throw new HttpException('Cobertura no encontrada', HttpStatus.NOT_FOUND);
      }
      reglaExistente.cobertura = cobertura;
    } else {
      reglaExistente.cobertura = null;
    }
  
    // Validar y actualizar el TipoMonedaID
    if (regla.TipoMonedaID) {
      const tipoMoneda = await this.tiposMonedaRepository.findOne({
        where: { TipoMonedaID: regla.TipoMonedaID },
      });
      if (!tipoMoneda) {
        throw new HttpException('Tipo de Moneda no encontrado', HttpStatus.NOT_FOUND);
      }
      reglaExistente.TipoMonedaID = regla.TipoMonedaID;
    } else {
      reglaExistente.TipoMonedaID = null;
    }
  
    // Actualizar otros campos
    const { condiciones, ...otrosCampos } = regla;
    await this.reglasNegocioRepository.update(id, otrosCampos);
  
    // Manejar condiciones si se proporcionan
    if (condiciones && condiciones.length > 0) {
      await this.condicionesReglasRepository.delete({ regla: { ReglaID: id } });
  
      for (const condicion of condiciones) {
        const nuevaCondicion = this.condicionesReglasRepository.create(condicion);
        nuevaCondicion.regla = reglaExistente;
        await this.condicionesReglasRepository.save(nuevaCondicion);
      }
    }
  
    return this.findOne(id);
  }
  
  
  async findOne(id: number): Promise<ReglasNegocio> {
    const regla = await this.reglasNegocioRepository.findOne({
      where: { ReglaID: id },
      relations: [
        'condiciones',
        'cobertura',
        'tipoMoneda',
        'cobertura.tipoMoneda',
      ],
    });

    if (!regla) {
      throw new HttpException(
        'Regla de Negocio no encontrada',
        HttpStatus.NOT_FOUND,
      );
    }

    return regla;
  }

  async findAll(): Promise<ReglasNegocio[]> {
    return this.reglasNegocioRepository.find({
      relations: [
        'condiciones',
        'cobertura',
        'tipoMoneda',
        'cobertura.tipoMoneda',
      ],
    });
  }

  // Eliminar una regla de negocio y sus condiciones
  async remove(id: number, usuario: string, motivo?: string): Promise<void> {
    const reglaExistente = await this.findOne(id);
    if (!reglaExistente) {
      throw new HttpException(
        'Regla de Negocio no encontrada',
        HttpStatus.NOT_FOUND,
      );
    }

    // Eliminar las condiciones relacionadas con la regla
    await this.condicionesReglasRepository.delete({ regla: { ReglaID: id } });

    // Eliminar la regla
    await this.reglasNegocioRepository.delete(id);
  }
}
