import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PagosPoliza } from './entities/pagos-poliza.entity';
import {
  CreatePagosPolizaDto,
  UpdatePagosPolizaDto,
} from './dto/pagos-poliza.dto';
import { MetodosPago } from 'src/metodos-pago/entities/metodos-pago.entity';
import { EstatusPago } from 'src/estatus-pago/entities/estatus-pago.entity';
import { BitacoraEdiciones } from 'src/bitacora-ediciones/bitacora-ediciones.entity';
import { BitacoraEliminaciones } from 'src/bitacora-eliminaciones/bitacora-eliminaciones.entity';
import { usuarios } from 'src/users/users.entity';
import { Poliza } from 'src/polizas/entities/poliza.entity';
import { CuentasBancarias } from 'src/cuentas-bancarias/entities/cuentas-bancarias.entity';

@Injectable()
export class PagosPolizaService {
  constructor(
    @InjectRepository(PagosPoliza, 'db1')
    private readonly pagosPolizaRepository: Repository<PagosPoliza>,

    @InjectRepository(MetodosPago, 'db1')
    private readonly metodosPagoRepository: Repository<MetodosPago>,

    @InjectRepository(EstatusPago, 'db1')
    private readonly estatusPagoRepository: Repository<EstatusPago>,

    @InjectRepository(usuarios, 'db1')
    private readonly usuariosRepository: Repository<usuarios>,

    @InjectRepository(Poliza, 'db1')
    private readonly polizasRepository: Repository<Poliza>,

    @InjectRepository(CuentasBancarias, 'db1')
    private readonly cuentasBancariasRepository: Repository<CuentasBancarias>,

    @InjectRepository(BitacoraEdiciones, 'db1')
    private readonly bitacoraEdicionesRepository: Repository<BitacoraEdiciones>,

    @InjectRepository(BitacoraEliminaciones, 'db1')
    private readonly bitacoraEliminacionesRepository: Repository<BitacoraEliminaciones>,
  ) { }

  async create(createDto: CreatePagosPolizaDto): Promise<PagosPoliza> {
    const {
      MontoPagado,
      IDMetodoPago,
      UsuarioID,
      ReferenciaPago,
      NombreTitular,
      PolizaID,
      Validado, // VALIDACIÓN NUEVA
      UsuarioValidoID, // VALIDACIÓN NUEVA
      CuentaBancariaID, // VALIDACIÓN NUEVA
    } = createDto;

    if (!MontoPagado || MontoPagado <= 0) {
      throw new HttpException(
        'El monto pagado debe ser mayor a 0',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!UsuarioID) {
      throw new HttpException(
        'El usuario es obligatorio en la solicitud',
        HttpStatus.BAD_REQUEST,
      );
    }

    const usuario = await this.usuariosRepository.findOne({
      where: { UsuarioID },
    });
    if (!usuario) {
      throw new HttpException('Usuario no encontrado', HttpStatus.BAD_REQUEST);
    }

    const metodoPago = IDMetodoPago
      ? await this.metodosPagoRepository.findOne({ where: { IDMetodoPago } })
      : null;

    if (IDMetodoPago && !metodoPago) {
      throw new HttpException(
        'Método de pago no encontrado',
        HttpStatus.BAD_REQUEST,
      );
    }

    if ([1, 2, 4].includes(IDMetodoPago)) {
      if (!ReferenciaPago) {
        throw new HttpException(
          'La referencia de pago es obligatoria para este método de pago',
          HttpStatus.BAD_REQUEST,
        );
      }
      if (!NombreTitular) {
        throw new HttpException(
          'El nombre del titular es obligatorio para este método de pago',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    const estatusPago = createDto.IDEstatusPago
      ? await this.estatusPagoRepository.findOne({
        where: { IDEstatusPago: createDto.IDEstatusPago },
      })
      : null;

    if (createDto.IDEstatusPago && !estatusPago) {
      throw new HttpException(
        'Estatus de pago no encontrado',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validar el historial de pagos contra la PrimaTotal
    const poliza = await this.polizasRepository.findOne({
      where: { PolizaID },
    });

    if (!poliza) {
      throw new HttpException('Póliza no encontrada', HttpStatus.NOT_FOUND);
    }

    const { PrimaTotal, EstadoPoliza } = poliza;

    // Obtener el monto total de los pagos ya registrados
    const pagosRealizados = await this.pagosPolizaRepository.find({
      where: { PolizaID, EstatusPago: { IDEstatusPago: 1 } }, // Solo pagos con estatus activo
      relations: ['EstatusPago'],
    });

    const totalPagado = pagosRealizados.reduce(
      (sum, pago) => sum + (Number(pago.MontoPagado) || 0),
      0,
    );

    const saldoRestante = PrimaTotal - totalPagado;

    if (MontoPagado > saldoRestante) {
      throw new HttpException(
        `El monto a pagar excede el saldo restante de la póliza. Saldo restante: ${saldoRestante.toFixed(
          2,
        )}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const usuarioValido = createDto.UsuarioValidoID
      ? await this.usuariosRepository.findOne({
        where: { UsuarioID: createDto.UsuarioValidoID },
      })
      : null;

    if (createDto.UsuarioValidoID && !usuarioValido) {
      throw new HttpException(
        'Usuario válido no encontrado',
        HttpStatus.BAD_REQUEST,
      );
    }

    const cuentaBancaria = createDto.CuentaBancariaID
      ? await this.cuentasBancariasRepository.findOne({
        where: { CuentaBancariaID: createDto.CuentaBancariaID },
      })
      : null;

    if (createDto.CuentaBancariaID && !cuentaBancaria) {
      throw new HttpException(
        'Cuenta bancaria no encontrada',
        HttpStatus.BAD_REQUEST,
      );
    }

    // VALIDACIÓN NUEVA: Si el tipo de pago es diferente de efectivo (3)
    if (IDMetodoPago !== 3) {
     /* if (!Validado) {
        throw new HttpException(
          'El campo Validado es obligatorio para este método de pago',
          HttpStatus.BAD_REQUEST,
        );
      }
      if (!UsuarioValidoID) {
        throw new HttpException(
          'El campo UsuarioValidoID es obligatorio para este método de pago',
          HttpStatus.BAD_REQUEST,
        );
      }*/
      if (!CuentaBancariaID) {
        throw new HttpException(
          'El campo CuentaBancariaID es obligatorio para este método de pago',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Asignar el estatus de pago a "En Proceso" (4)
      createDto.IDEstatusPago = 4;
    }

    const nuevoPago = this.pagosPolizaRepository.create({
      ...createDto,
      MetodoPago: metodoPago,
      EstatusPago: estatusPago,
      Usuario: usuario,
      UsuarioValido: usuarioValido,
      CuentaBancaria: cuentaBancaria,
    });

    const savedPago = await this.pagosPolizaRepository.save(nuevoPago);

    // Incrementar TotalPagos en la póliza
    await this.incrementarTotalPagos(PolizaID);

    // Si es el primer pago y el estado de la póliza es "PERIODO DE GRACIA", cambiar a "ACTIVA"
    if (pagosRealizados.length === 0 && EstadoPoliza === 'PERIODO DE GRACIA') {
      poliza.EstadoPoliza = 'ACTIVA';
      await this.polizasRepository.save(poliza);
    }

    const bitacora = this.bitacoraEdicionesRepository.create({
      Entidad: 'PagosPoliza',
      EntidadID: savedPago.PagoID,
      CamposModificados: createDto,
      UsuarioEdicion: usuario.NombreUsuario,
    });

    await this.bitacoraEdicionesRepository.save(bitacora);

    return savedPago;
  }

  async findAll(): Promise<PagosPoliza[]> {
    return await this.pagosPolizaRepository.find({
      relations: ['MetodoPago', 'EstatusPago', 'Usuario'],
    });
  }

  async findOne(id: number): Promise<PagosPoliza> {
    const pago = await this.pagosPolizaRepository.findOne({
      where: { PagoID: id },
      relations: ['MetodoPago', 'EstatusPago', 'Usuario'],
    });
    if (!pago) {
      throw new HttpException('Pago no encontrado', HttpStatus.NOT_FOUND);
    }
    return pago;
  }

  async getTotalMontoByPolizaId(polizaId: number): Promise<number> {
    const pagos = await this.pagosPolizaRepository.find({
      where: { PolizaID: polizaId, EstatusPago: { IDEstatusPago: 1 } }, // Estatus activo (pagado)
      relations: ['EstatusPago'],
    });

    return pagos.reduce(
      (total, pago) => total + (Number(pago.MontoPagado) || 0),
      0,
    );
  }

  async getPagosByPolizaId(polizaId: number): Promise<PagosPoliza[]> {
    return await this.pagosPolizaRepository.find({
      where: { PolizaID: polizaId },
      relations: ['MetodoPago', 'EstatusPago', 'Usuario'],
    });
  }

  async getPagosByUsuario(usuarioID: number): Promise<PagosPoliza[]> {
    const usuario = await this.usuariosRepository.findOne({
      where: { UsuarioID: usuarioID },
    });

    if (!usuario) {
      throw new HttpException('Usuario no encontrado', HttpStatus.NOT_FOUND);
    }

    return await this.pagosPolizaRepository.find({
      where: { Usuario: { UsuarioID: usuarioID } },
      relations: ['MetodoPago', 'EstatusPago', 'Usuario', 'CuentaBancaria'],
    });
  }

  async update(
    id: number,
    updateDto: UpdatePagosPolizaDto,
  ): Promise<PagosPoliza> {
    const pago = await this.findOne(id);

    if (updateDto.IDEstatusPago === 3) {
      throw new HttpException(
        'No se permite cambiar el estatus del pago a CANCELADO',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (updateDto.FechaMovimiento) {
      throw new HttpException(
        'No se permite editar el campo FechaMovimiento',
        HttpStatus.BAD_REQUEST,
      );
    }

    const metodoPago = updateDto.IDMetodoPago
      ? await this.metodosPagoRepository.findOne({
        where: { IDMetodoPago: updateDto.IDMetodoPago },
      })
      : pago.MetodoPago;

    if (!metodoPago) {
      throw new HttpException(
        'Método de pago no encontrado',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validación de UsuarioValidoID
    const usuarioValido = updateDto.UsuarioValidoID
      ? await this.usuariosRepository.findOne({
        where: { UsuarioID: updateDto.UsuarioValidoID },
      })
      : null;

    if (updateDto.UsuarioValidoID && !usuarioValido) {
      throw new HttpException(
        'Usuario válido no encontrado',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validación de CuentaBancariaID
    const cuentaBancaria = updateDto.CuentaBancariaID
      ? await this.cuentasBancariasRepository.findOne({
        where: { CuentaBancariaID: updateDto.CuentaBancariaID },
      })
      : null;

    if (updateDto.CuentaBancariaID && !cuentaBancaria) {
      throw new HttpException(
        'Cuenta bancaria no encontrada',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validación obligatoria si el tipo de pago es diferente de efectivo (IDMetodoPago !== 3)
    if (metodoPago.IDMetodoPago !== 3) {
      if (!updateDto.Validado) {
        throw new HttpException(
          'El campo "Validado" es obligatorio para métodos de pago distintos de efectivo',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (!updateDto.UsuarioValidoID) {
        throw new HttpException(
          'El campo "UsuarioValidoID" es obligatorio para métodos de pago distintos de efectivo',
          HttpStatus.BAD_REQUEST,
        );
      }

    }

    const estatusPago = updateDto.IDEstatusPago
      ? await this.estatusPagoRepository.findOne({
        where: { IDEstatusPago: updateDto.IDEstatusPago },
      })
      : pago.EstatusPago;

    const camposModificados = {};
    for (const [key, value] of Object.entries(updateDto)) {
      if (pago[key] !== value) {
        camposModificados[key] = { anterior: pago[key], nuevo: value };
      }
    }

    Object.assign(pago, updateDto, {
      MetodoPago: metodoPago,
      EstatusPago: estatusPago,
      UsuarioValido: usuarioValido,
      CuentaBancaria: cuentaBancaria,
    });

    const updatedPago = await this.pagosPolizaRepository.save(pago);

    if (Object.keys(camposModificados).length > 0) {
      const bitacora = this.bitacoraEdicionesRepository.create({
        Entidad: 'PagosPoliza',
        EntidadID: updatedPago.PagoID,
        CamposModificados: camposModificados,
        UsuarioEdicion: updatedPago.Usuario.NombreUsuario,
      });
      await this.bitacoraEdicionesRepository.save(bitacora);
    }

    return updatedPago;
  }

  async cancelPago(
    id: number,
    usuarioId: number,
    motivoCancelacion: string,
  ): Promise<string> {
    const pago = await this.findOne(id);

    if (!pago) {
      throw new HttpException('Pago no encontrado', HttpStatus.NOT_FOUND);
    }

    if (!motivoCancelacion) {
      throw new HttpException(
        'Motivo de cancelación es obligatorio',
        HttpStatus.BAD_REQUEST,
      );
    }

    const usuario = await this.usuariosRepository.findOne({
      where: { UsuarioID: usuarioId },
    });
    if (!usuario) {
      throw new HttpException('Usuario no encontrado', HttpStatus.NOT_FOUND);
    }

    pago.EstatusPago = await this.estatusPagoRepository.findOne({
      where: { IDEstatusPago: 3 },
    }); // Estatus cancelado
    pago.Usuario = usuario;
    pago.MotivoCancelacion = motivoCancelacion;

    const canceledPago = await this.pagosPolizaRepository.save(pago);

    // Decrementar TotalPagos en la póliza
    await this.decrementarTotalPagos(pago.PolizaID);

    const bitacora = this.bitacoraEliminacionesRepository.create({
      Entidad: 'PagosPoliza',
      EntidadID: canceledPago.PagoID,
      UsuarioEliminacion: usuario.NombreUsuario,
      MotivoEliminacion: motivoCancelacion,
    });

    await this.bitacoraEliminacionesRepository.save(bitacora);
    return `Pago con ID ${id} cancelado exitosamente.`;
  }

  private async incrementarTotalPagos(polizaId: number): Promise<void> {
    const poliza = await this.polizasRepository.findOne({
      where: { PolizaID: polizaId },
    });
    if (!poliza) {
      throw new HttpException('Póliza no encontrada', HttpStatus.NOT_FOUND);
    }
    poliza.TotalPagos = (Number(poliza.TotalPagos) || 0) + 1; // Convertir a número antes de sumar
    await this.polizasRepository.save(poliza);
  }

  private async decrementarTotalPagos(polizaId: number): Promise<void> {
    const poliza = await this.polizasRepository.findOne({
      where: { PolizaID: polizaId },
    });
    if (!poliza) {
      throw new HttpException('Póliza no encontrada', HttpStatus.NOT_FOUND);
    }
    poliza.TotalPagos = Math.max((Number(poliza.TotalPagos) || 1) - 1, 0); // Convertir a número antes de restar y evitar valores negativos
    await this.polizasRepository.save(poliza);
  }

  /**
 * Devuelve los pagos NO validados con método de pago distinto de EFECTIVO (ID=3).
 * Filtros opcionales por rango de fechas, usuario y póliza.
 */
  async getPagosSinValidarNoEfectivo(params?: {
    fechaInicio?: Date;
    fechaFin?: Date;
    usuarioID?: number;
    polizaID?: number;
  }): Promise<PagosPoliza[]> {
    const qb = this.pagosPolizaRepository
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.MetodoPago', 'mp')
      .leftJoinAndSelect('p.EstatusPago', 'ep')
      .leftJoinAndSelect('p.Usuario', 'u')
      .leftJoinAndSelect('p.UsuarioValido', 'uv')
      .leftJoinAndSelect('p.CuentaBancaria', 'cb')
      .where('p.Validado = :validado', { validado: false })
      .andWhere('mp.IDMetodoPago != :efectivo', { efectivo: 3 })
      .andWhere('(p.MotivoCancelacion IS NULL OR p.MotivoCancelacion = \'\')');

    if (params?.fechaInicio && params?.fechaFin) {
      qb.andWhere('p.FechaMovimiento BETWEEN :ini AND :fin', {
        ini: params.fechaInicio,
        fin: params.fechaFin,
      });
    }

    if (params?.usuarioID) {
      qb.andWhere('u.UsuarioID = :usuarioID', { usuarioID: params.usuarioID });
    }

    if (params?.polizaID) {
      qb.andWhere('p.PolizaID = :polizaID', { polizaID: params.polizaID });
    }

    qb.orderBy('p.FechaMovimiento', 'DESC');

    return qb.getMany();
  }
}
