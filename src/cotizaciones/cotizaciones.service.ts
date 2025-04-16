import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cotizacion } from './entities/cotizacion.entity';
import { DetallesCotizacionPoliza } from './entities/detalle-cotizacion-poliza.entity';
import { CreateCotizacionDto } from './dto/create-cotizacion.dto';
import { UpdateCotizacionDto } from './dto/update-cotizacion.dto';
import { BitacoraEdiciones } from 'src/bitacora-ediciones/bitacora-ediciones.entity';
import { BitacoraEliminaciones } from 'src/bitacora-eliminaciones/bitacora-eliminaciones.entity';

@Injectable()
export class CotizacionesService {
  constructor(
    @InjectRepository(Cotizacion, 'db1')
    private readonly cotizacionesRepository: Repository<Cotizacion>,
    @InjectRepository(DetallesCotizacionPoliza, 'db1')
    private readonly detallesRepository: Repository<DetallesCotizacionPoliza>,
    @InjectRepository(BitacoraEdiciones, 'db1')
    private readonly bitacoraEdicionesRepository: Repository<BitacoraEdiciones>,
    @InjectRepository(BitacoraEliminaciones, 'db1')
    private readonly bitacoraEliminacionesRepository: Repository<BitacoraEliminaciones>,
  ) {}

  async create(createCotizacionDto: CreateCotizacionDto): Promise<Cotizacion> {
    const { detalles, ...cotizacionData } = createCotizacionDto;

    const cotizacion = this.cotizacionesRepository.create(cotizacionData);
    const savedCotizacion = await this.cotizacionesRepository.save(cotizacion);

    if (detalles && detalles.length > 0) {
      const detallesToSave = detalles.map((detalle) =>
        this.detallesRepository.create({
          ...detalle,
          cotizacion: savedCotizacion,
        }),
      );
      await this.detallesRepository.save(detallesToSave);
    }

    return savedCotizacion;
  }

  findAll() {
    return this.cotizacionesRepository.find({
      relations: ['detalles'],
      order: { CotizacionID: 'DESC' }, // Orden descendente por CotizacionID
    });
  }

  findOne(id: number) {
    return this.cotizacionesRepository.findOne({
      where: { CotizacionID: id },
      relations: ['detalles'],
      order: { CotizacionID: 'DESC' }, // Este orden es redundante para findOne, pero lo dejamos como ejemplo
    });
  }

  async update(
    id: number,
    updateCotizacionDto: UpdateCotizacionDto,
    usuario: string,
  ): Promise<Cotizacion> {
    const { detalles, ...cotizacionData } = updateCotizacionDto;

    const cotizacion = await this.findOne(id);
    if (!cotizacion) {
      throw new HttpException('Cotización no encontrada', HttpStatus.NOT_FOUND);
    }

    await this.cotizacionesRepository.update(id, {
      ...cotizacionData,
      FechaUltimaActualizacion: undefined, // MySQL lo maneja automáticamente
    });

    if (detalles && detalles.length > 0) {
      console.info('entre a detalles');
      await this.detallesRepository.delete({
        cotizacion: { CotizacionID: id },
      });

      const detallesToSave = detalles.map((detalle) =>
        this.detallesRepository.create({
          ...detalle,
          cotizacion,
        }),
      );

      console.log(detallesToSave);

      await this.detallesRepository.save(detallesToSave);
    }

    return this.findOne(id);
  }

  async remove(
    id: number,
    usuario: string,
    motivoEliminacion?: string,
  ): Promise<{ message: string }> {
    const cotizacion = await this.findOne(id);
    if (!cotizacion) {
      throw new HttpException('Cotización no encontrada', HttpStatus.NOT_FOUND);
    }

    cotizacion.EstadoCotizacion = 'RECHAZADA';
    await this.cotizacionesRepository.save(cotizacion);

    const bitacora = this.bitacoraEliminacionesRepository.create({
      Entidad: 'Cotizacion',
      EntidadID: id,
      UsuarioEliminacion: usuario,
      MotivoEliminacion: motivoEliminacion,
    });
    await this.bitacoraEliminacionesRepository.save(bitacora);

    return { message: `La cotización con ID ${id} ha sido rechazada.` };
  }

  async updateStatus(
    id: number,
    nuevoEstado: 'REGISTRO' | 'EMITIDA' | 'ACEPTADA' | 'ACTIVA' | 'RECHAZADA',
    usuario: string,
  ): Promise<{ message: string }> {
    // Verifica si la cotización existe
    const cotizacion = await this.findOne(id);
    if (!cotizacion) {
      throw new HttpException('Cotización no encontrada', HttpStatus.NOT_FOUND);
    }

    // Validar el nuevo estado
    const estadosPermitidos = [
      'REGISTRO',
      'EMITIDA',
      'ACEPTADA',
      'ACTIVA',
      'RECHAZADA',
    ];
    if (!estadosPermitidos.includes(nuevoEstado)) {
      throw new HttpException(
        `Estado inválido. Los estados permitidos son: ${estadosPermitidos.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Almacena el estado anterior
    const estadoAnterior = cotizacion.EstadoCotizacion;

    // Actualiza el estado de la cotización
    cotizacion.EstadoCotizacion = nuevoEstado;
    await this.cotizacionesRepository.save(cotizacion);

    // Registrar en la bitácora de ediciones
    const cambios = {
      EstadoCotizacion: {
        anterior: estadoAnterior,
        nuevo: nuevoEstado,
      },
    };

    const bitacora = this.bitacoraEdicionesRepository.create({
      Entidad: 'Cotizacion',
      EntidadID: id,
      CamposModificados: cambios,
      UsuarioEdicion: usuario,
    });

    await this.bitacoraEdicionesRepository.save(bitacora);

    return {
      message: `Estado de la cotización con ID ${id} actualizado a '${nuevoEstado}'`,
    };
  }
}
