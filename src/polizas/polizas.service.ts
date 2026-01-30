import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { DetallesCotizacionPoliza } from 'src/cotizaciones/entities/detalle-cotizacion-poliza.entity';
import { BitacoraEliminacionesService } from 'src/bitacora-eliminaciones/bitacora-eliminaciones.service';
import { BitacoraEdicionesService } from 'src/bitacora-ediciones/bitacora-ediciones.service';
import { CreatePolizaDto } from './dto/create-poliza.dto';
import { UpdatePolizaDto } from './dto/update-poliza.dto';
import { Poliza } from './entities/poliza.entity';
import { PolizaHistorial } from './entities/poliza-historial.entity';
import { Cotizacion } from 'src/cotizaciones/entities/cotizacion.entity';
import { TipoPago } from 'src/tipos-pago/tipo-pago.entity';
import { Clientes } from 'src/clientes/clientes.entity';
import { Vehiculos } from 'src/vehiculos/vehiculos.entity';
import { PagosPoliza } from 'src/pagos-poliza/entities/pagos-poliza.entity';
import * as validator from 'validator'; // Usar la biblioteca 'validator' para sanitizar
import {
  ESTADOS_POLIZA,
  ESTADOS_VIGENTES,
  ESTADOS_VALIDOS_UPDATE,
} from './polizas.constants';

@Injectable()
export class PolizasService {
  constructor(
    @InjectRepository(Poliza, 'db1')
    private readonly polizasRepository: Repository<Poliza>,
    @InjectRepository(PolizaHistorial, 'db1')
    private readonly polizaHistorialRepository: Repository<PolizaHistorial>,
    @InjectRepository(DetallesCotizacionPoliza, 'db1')
    private readonly detallesRepository: Repository<DetallesCotizacionPoliza>,
    @InjectRepository(Cotizacion, 'db1')
    private readonly cotizacionRepository: Repository<Cotizacion>,
    @InjectRepository(TipoPago, 'db1')
    private readonly tipoPagoRepository: Repository<TipoPago>,
    @InjectRepository(Clientes, 'db1')
    private readonly clientesRepository: Repository<Clientes>,
    @InjectRepository(Vehiculos, 'db1')
    private readonly vehiculosRepository: Repository<Vehiculos>,
    @InjectRepository(PagosPoliza, 'db1')
    private readonly pagosPolizaRepository: Repository<PagosPoliza>,
    private readonly bitacoraEdicionesService: BitacoraEdicionesService,
    private readonly bitacoraEliminacionesService: BitacoraEliminacionesService,
  ) { }

  async create(createPolizaDto: CreatePolizaDto): Promise<Poliza> {
    const { CotizacionID, TipoPagoID, VehiculoID, ClienteID, ...polizaData } =
      createPolizaDto;
    //validar cotizacion
    //validar tipo de pago
    //validar vehiculo
    //validar cliente
    //generar folio de poliza
    //guardar poliza
    //update en detalle cotizacion
    //crear primera versión de póliza
    const poliza = new Poliza();
    let tipoPagoDescripcion = '';

    if (CotizacionID) {
      const cotizacion = await this.cotizacionRepository.findOne({
        where: { CotizacionID },
      });
      if (!cotizacion) {
        throw new HttpException(
          'Cotización no encontrada',
          HttpStatus.NOT_FOUND,
        );
      }
      poliza.cotizacion = cotizacion;
    }

    if (TipoPagoID) {
      const tipoPago = await this.tipoPagoRepository.findOne({
        where: { TipoPagoID },
      });
      if (!tipoPago) {
        throw new HttpException(
          'Tipo de pago no encontrado',
          HttpStatus.NOT_FOUND,
        );
      }
      poliza.tipoPago = tipoPago;
      tipoPagoDescripcion = tipoPago.Descripcion; // Guardar la descripción del tipo de pago
    }

    if (VehiculoID) {
      const vehiculo = await this.vehiculosRepository.findOne({
        where: { VehiculoID }, // Aquí debe ser VehiculoID
      });
      if (!vehiculo) {
        throw new HttpException('Vehículo no encontrado', HttpStatus.NOT_FOUND);
      }
      poliza.vehiculo = vehiculo;
    }

    if (ClienteID) {
      const cliente = await this.clientesRepository.findOne({
        where: { ClienteID },
      });
      if (!cliente) {
        throw new HttpException('Cliente no encontrado', HttpStatus.NOT_FOUND);
      }
      poliza.cliente = cliente;
    }

    // Asignar el resto de los datos de la póliza
    Object.assign(poliza, polizaData);
    poliza.VersionActual = 1.0; // Inicializar la versión

    // Determinar estado inicial según período de gracia de la cotización
    if (poliza.cotizacion?.PeriodoGracia === 0) {
      poliza.EstadoPoliza = ESTADOS_POLIZA.PAGO_INMEDIATO;
    } else {
      poliza.EstadoPoliza = ESTADOS_POLIZA.PERIODO_GRACIA;
    }

    console.log(tipoPagoDescripcion);
    // Generar folio de la póliza
    poliza.NumeroPoliza = await this.generarFolioPoliza(tipoPagoDescripcion);

    // Guardar la póliza en la base de datos
    const savedPoliza = await this.polizasRepository.save(poliza);

    // Actualizar el PolizaID en los detalles relacionados
    if (createPolizaDto.CotizacionID) {
      const detallesRelacionados = await this.detallesRepository.find({
        where: { cotizacion: { CotizacionID: createPolizaDto.CotizacionID } },
      });
      for (const detalle of detallesRelacionados) {
        detalle.poliza = savedPoliza; // Asociar directamente la póliza
        detalle.EsPoliza = true;
        await this.detallesRepository.save(detalle);
      }
    }
    // Insertar un historial inicial
    await this.createHistorial(savedPoliza, 1.0);

    return savedPoliza;
  }

  async findAll(): Promise<Poliza[]> {
    return this.polizasRepository.find({
      relations: ['historial', 'detalles', 'cotizacion', 'cliente'],
      order: { FechaEmision: 'DESC' }, // Orden descendente por FechaEmision
    });
  }

  async findOne(id: number): Promise<Poliza> {
    const poliza = await this.polizasRepository.findOne({
      where: { PolizaID: id },
      relations: ['historial', 'detalles', 'cotizacion', 'cliente'],
    });

    if (!poliza) {
      throw new HttpException('Póliza no encontrada', HttpStatus.NOT_FOUND);
    }

    return poliza;
  }

  async update(
    id: number,
    updatePolizaDto: UpdatePolizaDto,
    usuario: string,
  ): Promise<Poliza> {
    const polizaExistente = await this.findOne(id);

    if (!polizaExistente) {
      throw new HttpException('Póliza no encontrada', HttpStatus.NOT_FOUND);
    }

    // Validar que el nuevo estado sea válido
    if (
      updatePolizaDto.EstadoPoliza &&
      !ESTADOS_VALIDOS_UPDATE.includes(updatePolizaDto.EstadoPoliza as any)
    ) {
      throw new HttpException(
        'Estado de póliza no válido. Debe ser ACTIVA, PENDIENTE, PERIODO DE GRACIA o PAGO INMEDIATO',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Buscar y actualizar el tipo de pago si se incluye en el DTO
    const tipoPago = updatePolizaDto.TipoPagoID
      ? await this.tipoPagoRepository.findOne({
        where: { TipoPagoID: updatePolizaDto.TipoPagoID },
      })
      : polizaExistente.tipoPago;

    if (updatePolizaDto.TipoPagoID && !tipoPago) {
      throw new HttpException(
        'Tipo de pago no encontrado',
        HttpStatus.NOT_FOUND,
      );
    }

    // Actualizar otros datos de la póliza
    Object.assign(polizaExistente, updatePolizaDto);
    polizaExistente.tipoPago = tipoPago;

    // Incrementar versión agrupada por PolizaID
    const maxVersion = await this.polizaHistorialRepository
      .createQueryBuilder('historial')
      .where('historial.PolizaID = :id', { id })
      .select('MAX(historial.Version)', 'maxVersion')
      .getRawOne();

    polizaExistente.VersionActual = (maxVersion?.maxVersion || 0) + 1;

    // Guardar la póliza en la base de datos
    const savedPoliza = await this.polizasRepository.save(polizaExistente);

    if (updatePolizaDto.CotizacionID) {
      const detallesRelacionados = await this.detallesRepository.find({
        where: { cotizacion: { CotizacionID: updatePolizaDto.CotizacionID } },
      });
      for (const detalle of detallesRelacionados) {
        detalle.poliza = savedPoliza; // Asociar directamente la póliza
        detalle.EsPoliza = true;
        await this.detallesRepository.save(detalle);
      }
    }
    // Insertar en historial
    await this.createHistorial(savedPoliza, polizaExistente.VersionActual);

    // Registrar en la bitácora de ediciones
    const camposModificados = {};
    for (const key in updatePolizaDto) {
      if (updatePolizaDto[key] !== polizaExistente[key]) {
        camposModificados[key] = {
          anterior: polizaExistente[key],
          nuevo: updatePolizaDto[key],
        };
      }
    }

    if (Object.keys(camposModificados).length > 0) {
      await this.bitacoraEdicionesService.registrarEdicion(
        'Poliza',
        id,
        camposModificados,
        usuario,
      );
    }

    return this.findOne(id);
  }

  async remove(
    id: number,
    usuario: string,
    motivoEliminacion?: string,
  ): Promise<string> {
    const poliza = await this.findOne(id);

    if (!poliza) {
      throw new HttpException('Póliza no encontrada', HttpStatus.NOT_FOUND);
    }

    // Cambiar el estado de la póliza a "CANCELADA"
    poliza.EstadoPoliza = 'CANCELADA';
    poliza.VersionActual = this.incrementarVersion(poliza.VersionActual || 1.0);
    await this.polizasRepository.save(poliza);

    // Insertar en historial como versión cancelada
    await this.createHistorial(
      poliza,
      poliza.VersionActual,
      new Date(),
      motivoEliminacion,
    );

    // Registrar en la bitácora de eliminaciones
    await this.bitacoraEliminacionesService.registrarEliminacion(
      'Poliza',
      id,
      usuario,
      motivoEliminacion,
    );

    return `Poliza con Folio ${poliza.NumeroPoliza} cancelada exitosamente.`;
  }

  /*async generarEsquemaPagos(identificador: { folio: string }): Promise<any> {
    console.log('Identificador recibido:', identificador);

    // Validar y sanitizar el folio para evitar inyecciones SQL
    if (
      !identificador.folio ||
      !validator.isAlphanumeric(identificador.folio)
    ) {
      throw new HttpException(
        'El folio proporcionado no es válido',
        HttpStatus.BAD_REQUEST,
      );
    }

    const folioSanitizado = validator.escape(identificador.folio.trim());

    // Obtener la póliza
    const poliza = await this.polizasRepository.findOne({
      where: { NumeroPoliza: folioSanitizado },
      relations: ['detalles', 'historial', 'tipoPago', 'cotizacion'],
    });

    console.log('Póliza completa:', poliza);
    console.log('Tipo de Pago:', poliza.tipoPago);
    console.log('Porcentaje Ajuste:', poliza.tipoPago?.PorcentajeAjuste);

    if (!poliza) {
      throw new HttpException('Póliza no encontrada', HttpStatus.NOT_FOUND);
    }

    // Validar que la póliza esté activa
    if (
      poliza.EstadoPoliza !== 'PERIODO DE GRACIA' &&
      poliza.EstadoPoliza !== 'ACTIVA'
    ) {
      throw new HttpException(
        'La póliza no está activa y no se puede generar el esquema de pagos',
        HttpStatus.BAD_REQUEST,
      );
    }

    const periodoGracia = poliza.cotizacion?.PeriodoGracia || 0;
    let mensajeAtraso = null;

    // Validar que la póliza esté en PERIODO DE GRACIA
    if (poliza.EstadoPoliza === 'PERIODO DE GRACIA') {
      // Obtener el periodo de gracia desde la cotización asociada a la póliza

      console.log('Periodo de Gracia obtenido:', periodoGracia);

      // Obtener la fecha de inicio de la póliza
      // Calcular la fecha límite del período de gracia correctamente
      const fechaInicioPoliza = new Date(poliza.FechaInicio);
      const fechaLimiteGracia = new Date(fechaInicioPoliza);
      fechaLimiteGracia.setDate(fechaLimiteGracia.getDate() + periodoGracia);

      console.log(
        'Fecha Límite del Período de Gracia:',
        fechaLimiteGracia.toISOString(),
      );

      // Obtener la fecha actual sin considerar horas (solo fecha local)
      const fechaActual = new Date();
      fechaActual.setHours(0, 0, 0, 0);

      console.log(
        'Fecha Actual (ajustada a 00:00 horas):',
        fechaActual.toISOString(),
      );

      if (fechaLimiteGracia < fechaActual) {
        console.log('El período de gracia ha terminado.');
        mensajeAtraso =
          'El período de gracia ha terminado. No se ha realizado el pago correspondiente.';
      } else {
        console.log(
          `La póliza sigue en PERIODO DE GRACIA hasta el ${fechaLimiteGracia.toISOString()}.`,
        );
      }
    }

    const {
      FechaEmision,
      NumeroPagos,
      PrimaTotal,
      DerechoPolizaAplicado,
      DescuentoProntoPago,
      FechaInicio,
      FechaFin,
      TotalSinIVA,
    } = poliza;

    // Convertir valores a números
    const numeroPagos = Number(NumeroPagos);
    const primaTotal = Number(PrimaTotal);
    const totalSinIVA = Number(TotalSinIVA);
    const derechoPolizaAplicado = Number(DerechoPolizaAplicado || 0);
    const descuentoProntoPago = Number(DescuentoProntoPago || 0);
    const porcentajeAjuste = Number(poliza.tipoPago?.PorcentajeAjuste || 0);
    const fechaEmision = new Date(poliza.FechaEmision); // Fecha de inicio de la póliza

    if (!FechaEmision || isNaN(numeroPagos) || isNaN(primaTotal)) {
      throw new HttpException(
        'La póliza no tiene los datos necesarios para generar un esquema de pagos',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Calcular el intervalo de pago y monto por pago
    const intervaloDias = this.calcularIntervaloDias(numeroPagos);

    // Generar el esquema de pagos
    const esquemaPagos = [];
    // Inicializar la fecha de pago como FechaEmision + Periodo de Gracia (ajustando correctamente la zona horaria)
    console.log('fecha emisión: ' + poliza.FechaEmision);
    // Inicializar la fecha de pago como FechaEmision + Periodo de Gracia usando fechas locales
    let fechaPago = new Date(poliza.FechaEmision);
    fechaPago.setDate(fechaPago.getDate() + periodoGracia);

    // Ajustar la fecha para ignorar desfases de zona horaria
    fechaPago = new Date(
      fechaPago.getFullYear(),
      fechaPago.getMonth(),
      fechaPago.getDate(),
      0,
      0,
      0,
      0,
    );

    console.log(
      'Fecha de Pago Inicial (FechaEmision + PeriodoGracia):',
      fechaPago,
    );

    // 1. Calcular el ajuste decimal
    const ajusteDecimal = 1 + porcentajeAjuste / 100;
    console.log(`Porcentaje Ajuste desde BD: ${porcentajeAjuste}`);
    console.log(
      `Ajuste Decimal: 1 + (${porcentajeAjuste} / 100) = ${ajusteDecimal}`,
    );
    // 2. Desglose de cada parte de la fórmula
    const totalPorPago = totalSinIVA / numeroPagos;
    console.log(
      `Total por Pago: ${totalSinIVA} / ${numeroPagos} = ${totalPorPago}`,
    );

    const totalConDerechoPoliza = totalPorPago + derechoPolizaAplicado;
    console.log(
      `Total con Derecho de Póliza: ${totalPorPago} + ${derechoPolizaAplicado} = ${totalConDerechoPoliza}`,
    );

    const totalConAjuste = totalConDerechoPoliza * ajusteDecimal;
    console.log(
      `Total con Ajuste Decimal: ${totalConDerechoPoliza} * ${ajusteDecimal} = ${totalConAjuste}`,
    );

    const totalConIVA = totalConAjuste * 1.16;
    console.log(`Total con IVA: ${totalConAjuste} * 1.16 = ${totalConIVA}`);

    // 3. Calcular el Primer Pago
    const primerPago = parseFloat(totalConIVA.toFixed(2));
    console.log(`Primer Pago Final: ${primerPago}`);

    // 3. Calcular los Pagos Subsecuentes
    const pagosSubsecuentes = parseFloat(
      ((primaTotal - primerPago) / (numeroPagos - 1)).toFixed(2),
    );

    for (let i = 0; i < numeroPagos; i++) {
      const montoPagar = i === 0 ? primerPago : pagosSubsecuentes;

      esquemaPagos.push({
        numeroPago: i + 1,
        fechaPago: new Date(fechaPago).toISOString(),
        montoPorPagar: montoPagar,
        estado: 'Pendiente',
        pagosRealizados: [],
      });

      // Avanzar la fecha al siguiente periodo (semestral, mensual, etc.)
      fechaPago = new Date(fechaPago);
      fechaPago.setMonth(fechaPago.getMonth() + 12 / numeroPagos); // Divide 12 entre número de pagos (mensual, semestral, etc.)
    }
    // Obtener los pagos realizados para la póliza
    const pagosRealizados = await this.pagosPolizaRepository.find({
      where: { PolizaID: poliza.PolizaID },
      relations: ['EstatusPago'],
      order: { FechaPago: 'ASC' },
    });

    // Filtrar pagos válidos (excluyendo los cancelados con EstatusPago.ID === 3)
    const pagosValidos = pagosRealizados.filter(
      (pago) => pago.EstatusPago?.IDEstatusPago !== 3,
    );

    let totalPagado = 0;
    let atrasos = 0;

    esquemaPagos.forEach((pago) => {
      const pagosPeriodo = pagosValidos.filter(
        (realizado) =>
          new Date(realizado.FechaPago).getTime() >=
            new Date(pago.fechaPago).getTime() &&
          new Date(realizado.FechaPago).getTime() <
            new Date(
              new Date(pago.fechaPago).setDate(
                new Date(pago.fechaPago).getDate() + intervaloDias,
              ),
            ).getTime(),
      );

      if (pagosPeriodo.length > 0) {
        const totalPagadoPeriodo = pagosPeriodo.reduce(
          (sum, p) => sum + Number(p.MontoPagado),
          0,
        );
        totalPagado += totalPagadoPeriodo;

        const pendienteValidacion = pagosPeriodo.some(
          (pagoRealizado) => pagoRealizado.EstatusPago?.IDEstatusPago === 4,
        );

        if (pendienteValidacion) {
          pago.estado = 'Pendiente de Validación';
        } else {
          pago.estado =
            totalPagadoPeriodo >= pago.montoPorPagar ? 'Pagado' : 'Parcial';
        }

        pago.pagosRealizados = pagosPeriodo.map((pagoRealizado) => ({
          montoPagado: Number(pagoRealizado.MontoPagado),
          fechaReal: pagoRealizado.FechaPago,
        }));
      } else if (new Date() > new Date(pago.fechaPago)) {
        pago.estado = 'Atrasado';
        atrasos += 1;
      }
    });

    const pagosFueraDeRango = pagosValidos.filter((pago) =>
      esquemaPagos.every(
        (esquema) =>
          new Date(pago.FechaPago).getTime() <
            new Date(esquema.fechaPago).getTime() ||
          new Date(pago.FechaPago).getTime() >=
            new Date(
              new Date(esquema.fechaPago).setDate(
                new Date(esquema.fechaPago).getDate() + intervaloDias,
              ),
            ).getTime(),
      ),
    );

    totalPagado += pagosFueraDeRango.reduce(
      (sum, pago) => sum + Number(pago.MontoPagado),
      0,
    );

    if (atrasos > 0) {
      mensajeAtraso = mensajeAtraso
        ? `${mensajeAtraso}. CLIENTE PRESENTA ATRASO DE ${atrasos} PERIODOS`
        : `CLIENTE PRESENTA ATRASO DE ${atrasos} PERIODOS`;
    }

    return {
      fechaInicio: FechaInicio,
      fechaFin: FechaFin,
      esquemaPagos,
      pagosFueraDeRango: pagosFueraDeRango.map((pago) => ({
        montoPagado: Number(pago.MontoPagado),
        fechaPago: pago.FechaPago,
      })),
      totalPrima: parseFloat(primaTotal.toFixed(2)),
      totalPagado: parseFloat(totalPagado.toFixed(2)),
      descuentoProntoPago: descuentoProntoPago > 0 ? descuentoProntoPago : null,
      mensajeAtraso,
      primerPago,
      pagosSubsecuentes,
    };
  }*/

  async generarEsquemaPagos(identificador: { folio: string }): Promise<any> {
    console.log('Identificador recibido:', identificador);

    // 0) Validación folio
    if (!identificador.folio || !validator.isAlphanumeric(identificador.folio)) {
      throw new HttpException('El folio proporcionado no es válido', HttpStatus.BAD_REQUEST);
    }
    const folioSanitizado = validator.escape(identificador.folio.trim());

    // 1) Traer póliza + relaciones
    const poliza = await this.polizasRepository.findOne({
      where: { NumeroPoliza: folioSanitizado },
      relations: ['detalles', 'historial', 'tipoPago', 'cotizacion'],
    });

    console.log('Póliza completa:', poliza);
    console.log('Tipo de Pago:', poliza?.tipoPago);
    console.log('Porcentaje Ajuste:', poliza?.tipoPago?.PorcentajeAjuste);

    if (!poliza) throw new HttpException('Póliza no encontrada', HttpStatus.NOT_FOUND);

    // Actualizar estado antes de generar esquema
    await this.actualizarEstadoPoliza(poliza);

    // Validar que la póliza esté en estado vigente
    if (!ESTADOS_VIGENTES.includes(poliza.EstadoPoliza as any)) {
      throw new HttpException(
        'La póliza no está activa y no se puede generar el esquema de pagos',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Helpers
    const round2 = (x: number) => Math.round((x + Number.EPSILON) * 100) / 100;

    const periodoGracia = Number(poliza.cotizacion?.PeriodoGracia || 0);
    const numeroPagos = Number(poliza.NumeroPagos);
    const primaTotal = Number(poliza.PrimaTotal);
    const totalSinIVA = Number(poliza.TotalSinIVA);
    const derechoPolizaAplicado = Number(poliza.DerechoPolizaAplicado || 0);
    const descuentoProntoPago = Number(poliza.DescuentoProntoPago || 0);
    const porcentajeAjuste = Number(poliza.tipoPago?.PorcentajeAjuste || 0);

    if (!poliza.FechaEmision || isNaN(numeroPagos) || isNaN(primaTotal) || numeroPagos <= 0) {
      throw new HttpException(
        'La póliza no tiene los datos necesarios para generar un esquema de pagos',
        HttpStatus.BAD_REQUEST,
      );
    }

    // 2) Periodo de gracia o pago inmediato (mensaje)
    let mensajeAtraso: string | null = null;

    // Verificar si la póliza requiere pago inmediato
    if (poliza.EstadoPoliza === ESTADOS_POLIZA.VENCIDA) {
      mensajeAtraso = 'PÓLIZA VENCIDA: Se requiere pago inmediato para reactivarla.';
    } else if (poliza.EstadoPoliza === ESTADOS_POLIZA.PAGO_INMEDIATO) {
      mensajeAtraso = 'Esta póliza requiere PAGO INMEDIATO para activarse. No se ha realizado el primer pago.';
    } else if (poliza.EstadoPoliza === ESTADOS_POLIZA.PERIODO_GRACIA) {
      const fechaInicioPoliza = new Date(poliza.FechaInicio);
      const fechaLimiteGracia = new Date(fechaInicioPoliza);
      fechaLimiteGracia.setDate(fechaLimiteGracia.getDate() + periodoGracia);

      const fechaActual = new Date();
      fechaActual.setHours(0, 0, 0, 0);

      if (fechaLimiteGracia < fechaActual) {
        mensajeAtraso = 'El período de gracia ha terminado. No se ha realizado el pago correspondiente.';
      }
    }

    // 3) Cálculos base (tu fórmula original)
    const ajusteDecimal = 1 + porcentajeAjuste / 100;
    const totalPorPago = totalSinIVA / numeroPagos;
    const totalConDerechoPoliza = totalPorPago + derechoPolizaAplicado;
    const totalConAjuste = totalConDerechoPoliza * ajusteDecimal;
    const totalConIVA = totalConAjuste * 1.16;

    const primerPago = round2(totalConIVA);
    const pagosSubsecuentes = numeroPagos > 1 ? round2((primaTotal - primerPago) / (numeroPagos - 1)) : round2(primaTotal);

    // 4) Construcción de fechas objetivo (usa tu frecuencia: 12/numeroPagos meses)
    let fechaPago: Date;

    // Si la póliza es de PAGO INMEDIATO, el primer abono vence inmediatamente (fecha actual)
    if (poliza.EstadoPoliza === ESTADOS_POLIZA.PAGO_INMEDIATO || periodoGracia === 0) {
      fechaPago = new Date();
      fechaPago = new Date(fechaPago.getFullYear(), fechaPago.getMonth(), fechaPago.getDate(), 0, 0, 0, 0);
    } else {
      // Aplicar el período de gracia normal
      fechaPago = new Date(poliza.FechaEmision);
      fechaPago.setDate(fechaPago.getDate() + periodoGracia);
      fechaPago = new Date(fechaPago.getFullYear(), fechaPago.getMonth(), fechaPago.getDate(), 0, 0, 0, 0);
    }

    const fechas: Date[] = [];
    for (let i = 0; i < numeroPagos; i++) {
      fechas.push(new Date(fechaPago));
      // Avanza por “frecuencia” (= 12/numeroPagos meses); asume divisor entero de 12
      const step = 12 / numeroPagos; // mensual/semestral/trimestral/anual...
      const next = new Date(fechaPago);
      next.setMonth(next.getMonth() + step);
      fechaPago = next;
    }

    // 5) Armar esquema con objetivo "histórico" (para marcar atrasos correctamente)
    const esquemaPagos = Array.from({ length: numeroPagos }, (_, i) => ({
      numeroPago: i + 1,
      fechaPago: fechas[i].toISOString(),
      montoObjetivo: i === 0 ? primerPago : pagosSubsecuentes, // objetivo NOMINAL histórico
      montoAplicado: 0,
      estado: 'Pendiente' as 'Pendiente' | 'Parcial' | 'Pagado' | 'Pendiente de Validación' | 'Atrasado',
      pagosRealizados: [] as { montoPagado: number; fechaReal: string }[],
    }));

    // 6) Traer pagos realizados y separar:
    const pagosRealizados = await this.pagosPolizaRepository.find({
      where: { PolizaID: poliza.PolizaID },
      relations: ['EstatusPago'],
      order: { FechaPago: 'ASC' },
    });

    // Excluir CANCELADOS (3); “Pendiente de Validación (4)” NO cuenta como pagado
    const pagosValidos = pagosRealizados.filter(
      (p) => p.EstatusPago?.IDEstatusPago !== 3 && (p.Validado === true || p.EstatusPago?.IDEstatusPago === 1),
    );

    // 7) Aplicar pagos válidos AL ESQUEMA HISTÓRICO por calendario (secuencial)
    let pagadoAcumulado = 0;
    for (const p of pagosValidos) {
      let porAplicar = Number(p.MontoPagado || 0);
      if (porAplicar <= 0) continue;

      for (let i = 0; i < esquemaPagos.length && porAplicar > 0; i++) {
        const objetivo = esquemaPagos[i].montoObjetivo;
        const aplicado = esquemaPagos[i].montoAplicado;
        const faltante = round2(Math.max(objetivo - aplicado, 0));
        if (faltante <= 0) continue;

        const aplicarAhora = round2(Math.min(faltante, porAplicar));
        esquemaPagos[i].montoAplicado = round2(aplicado + aplicarAhora);
        esquemaPagos[i].pagosRealizados.push({
          montoPagado: aplicarAhora,
          fechaReal: new Date(p.FechaPago).toISOString(), // 🔹 convertir Date → string
        });
        porAplicar = round2(porAplicar - aplicarAhora);
        pagadoAcumulado = round2(pagadoAcumulado + aplicarAhora);
      }
    }

    // 8) Recalcular monto objetivo de los periodos FUTUROS
    //    Lo ya pasado se queda con su objetivo histórico para poder marcar Atrasos.
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const indicesFuturos = esquemaPagos
      .map((it, i) => ({ i, f: new Date(it.fechaPago) }))
      .filter(({ f }) => f.getTime() >= hoy.getTime())
      .map(({ i }) => i);

    // Saldo restante dinámico (NO contar pendientes de validación como pagados)
    const restanteGlobal = Math.max(round2(primaTotal - pagadoAcumulado), 0);
    const futurosCount = Math.max(indicesFuturos.length, 0);

    // Reasignar SOLO futuros: repartir restante en partes iguales
    if (futurosCount > 0) {
      const cuota = round2(restanteGlobal / futurosCount);
      // Para compensar redondeos, reparte y ajusta el último
      let sumaAsignada = 0;
      indicesFuturos.forEach((idx, k) => {
        if (k < futurosCount - 1) {
          esquemaPagos[idx].montoObjetivo = cuota;
          sumaAsignada = round2(sumaAsignada + cuota);
        } else {
          // último = restanteGlobal - sumaAsignada (para cerrar exacto)
          esquemaPagos[idx].montoObjetivo = round2(Math.max(restanteGlobal - sumaAsignada, 0));
        }
      });
    } else {
      // No hay futuros; si queda restanteGlobal > 0, habrá atrasos/parciales en pasados.
    }

    // 9) Estados finales por periodo
    const intervaloDias = this.calcularIntervaloDias(numeroPagos);
    let conteoAtrasos = 0;

    for (const item of esquemaPagos) {
      const fechaInicioPer = new Date(item.fechaPago);
      const fechaFinPer = new Date(fechaInicioPer);
      fechaFinPer.setDate(fechaFinPer.getDate() + intervaloDias);

      const tienePendValid = pagosRealizados.some(
        (pr) =>
          new Date(pr.FechaPago).getTime() >= fechaInicioPer.getTime() &&
          new Date(pr.FechaPago).getTime() < fechaFinPer.getTime() &&
          pr.EstatusPago?.IDEstatusPago === 4,
      );

      const faltante = round2(Math.max(item.montoObjetivo - item.montoAplicado, 0));

      if (tienePendValid) {
        item.estado = 'Pendiente de Validación';
      } else if (faltante <= 0.009) {
        item.estado = 'Pagado';
      } else {
        // Si ya pasó el periodo, marcar como Atrasado; si no, Pendiente/Parcial
        const yaPaso = new Date().getTime() > fechaFinPer.getTime();
        if (yaPaso) {
          // Si tiene algo aplicado pero no cumplió => Parcial (pero con atraso)
          if (item.montoAplicado > 0) {
            item.estado = 'Parcial';
          } else {
            item.estado = 'Atrasado';
          }
          conteoAtrasos++;
        } else {
          item.estado = item.montoAplicado > 0 ? 'Parcial' : 'Pendiente';
        }
      }
    }

    if (conteoAtrasos > 0) {
      mensajeAtraso = mensajeAtraso
        ? `${mensajeAtraso}. CLIENTE PRESENTA ATRASO DE ${conteoAtrasos} PERIODOS`
        : `CLIENTE PRESENTA ATRASO DE ${conteoAtrasos} PERIODOS`;
    }

    // 10) Pagos fuera de rango (info)
    //     Ya no “rompen” el esquema: se aplican a saldo global y luego redistribuimos futuros.
    //     Aun así, devolvemos la lista informativa si quieres mostrarla.
    const pagosFueraDeRango = pagosValidos.filter((pago) =>
      esquemaPagos.every((slot) => {
        const ini = new Date(slot.fechaPago);
        const fin = new Date(ini); fin.setDate(fin.getDate() + intervaloDias);
        const t = new Date(pago.FechaPago).getTime();
        return !(t >= ini.getTime() && t < fin.getTime());
      }),
    );

    // Totales
    const totalPagado = round2(pagadoAcumulado);

    return {
      fechaInicio: poliza.FechaInicio,
      fechaFin: poliza.FechaFin,
      esquemaPagos,
      pagosFueraDeRango: pagosFueraDeRango.map((p) => ({
        montoPagado: Number(p.MontoPagado),
        fechaPago: p.FechaPago,
      })),
      totalPrima: round2(primaTotal),
      totalPagado,
      restante: round2(Math.max(primaTotal - totalPagado, 0)),
      descuentoProntoPago: descuentoProntoPago > 0 ? descuentoProntoPago : null,
      mensajeAtraso,
      primerPago,
      pagosSubsecuentes,
    };
  }


  private calcularIntervaloDias(numeroPagos: number): number {
    switch (numeroPagos) {
      case 1: // Anual
        return 365;
      case 2: // Semestral
        return 182;
      case 4: // Trimestral
        return 91;
      case 12: // Mensual
        return 30;
      default:
        throw new HttpException(
          'Número de pagos no soportado',
          HttpStatus.BAD_REQUEST,
        );
    }
  }

  private incrementarVersion(versionActual: number): number {
    return versionActual + 1;
  }

  private async createHistorial(
    poliza: Poliza,
    version: number,
    FechaCancelacion?: Date,
    MotivoCancelacion?: string,
  ): Promise<PolizaHistorial> {
    const historial = this.polizaHistorialRepository.create({
      poliza,
      NumeroPoliza: poliza.NumeroPoliza,
      Version: version,
      FechaInicio: poliza.FechaInicio,
      FechaFin: poliza.FechaFin,
      EstadoPoliza: poliza.EstadoPoliza,
      TotalPagos: poliza.TotalPagos || 0,
      NumeroPagos: poliza.NumeroPagos,
      MontoPorPago:
        poliza.PrimaTotal && poliza.NumeroPagos
          ? poliza.PrimaTotal / poliza.NumeroPagos
          : null,
      tipoPago: poliza.tipoPago,
      DescuentoProntoPago: poliza.DescuentoProntoPago,
      FechaCancelacion,
      MotivoCancelacion,
    });

    return await this.polizaHistorialRepository.save(historial);
  }

  private async generarFolioPoliza(tipoPago: string): Promise<string> {
    const fecha = new Date();
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');

    // Definir inicial basada en el tipo de pago
    let inicialTipoPago = '';
    switch (tipoPago.toLowerCase()) {
      case 'anual':
        inicialTipoPago = 'A';
        break;
      case 'semestral':
        inicialTipoPago = 'S';
        break;
      case 'mensual':
        inicialTipoPago = 'M';
        break;
      case 'trimestral':
        inicialTipoPago = 'T';
        break;
      default:
        inicialTipoPago = 'A'; // Inicial por defecto si no coincide
    }

    // Obtener el consecutivo actual
    const count = await this.polizasRepository.count();
    const consecutivo = String(count + 1).padStart(5, '0');

    return `P${inicialTipoPago}${año}${mes}${dia}${consecutivo}`;
  }

  // ===============================================================
  // HELPERS PRIVADOS - NO EXPONER EN CONTROLADOR
  // ===============================================================

  /**
   * Verifica si una póliza requiere pago inmediato
   * @private - NO exponer en controlador
   */
  private requierePagoInmediato(poliza: Poliza): boolean {
    return (
      poliza.cotizacion?.PeriodoGracia === 0 ||
      poliza.EstadoPoliza === ESTADOS_POLIZA.PAGO_INMEDIATO
    );
  }

  /**
   * Verifica si una póliza está en estado vigente (puede operar)
   * Usar para validaciones de consulta/lectura
   * @private - NO exponer en controlador
   */
  private estaVigente(poliza: Poliza): boolean {
    return ESTADOS_VIGENTES.includes(poliza.EstadoPoliza as any);
  }

  /**
   * Verifica si una póliza puede ser modificada (solo activas)
   * Usar para validaciones de escritura/modificación
   * @private - NO exponer en controlador
   */
  private puedeModificarse(poliza: Poliza): boolean {
    return poliza.EstadoPoliza === ESTADOS_POLIZA.ACTIVA;
  }

  /**
   * Verifica si la póliza requiere completar el primer pago para activarse
   * @private - NO exponer en controlador
   */
  private requierePrimerPago(poliza: Poliza): boolean {
    return (
      poliza.EstadoPoliza === ESTADOS_POLIZA.PAGO_INMEDIATO ||
      poliza.EstadoPoliza === ESTADOS_POLIZA.PERIODO_GRACIA
    );
  }

  /**
   * Actualiza el estado de una póliza individual basado en pagos y fechas
   * @private - Llamado internamente desde generarEsquemaPagos()
   */
  private async actualizarEstadoPoliza(poliza: Poliza): Promise<void> {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const pagosRealizados = await this.pagosPolizaRepository.count({
      where: {
        PolizaID: poliza.PolizaID,
        EstatusPago: { IDEstatusPago: 1 },
      },
    });

    const primerPagoRecibido = pagosRealizados > 0;
    const periodoGracia = Number(poliza.cotizacion?.PeriodoGracia || 0);
    const fechaInicio = new Date(poliza.FechaInicio);
    const fechaLimiteGracia = new Date(fechaInicio);
    fechaLimiteGracia.setDate(fechaLimiteGracia.getDate() + periodoGracia);

    let estadoNuevo = poliza.EstadoPoliza;

    if (
      primerPagoRecibido &&
      [ESTADOS_POLIZA.PENDIENTE, ESTADOS_POLIZA.PAGO_INMEDIATO, ESTADOS_POLIZA.PERIODO_GRACIA].includes(poliza.EstadoPoliza as any)
    ) {
      estadoNuevo = ESTADOS_POLIZA.ACTIVA;
    } else if (
      !primerPagoRecibido &&
      hoy > fechaLimiteGracia &&
      [ESTADOS_POLIZA.PENDIENTE, ESTADOS_POLIZA.PERIODO_GRACIA, ESTADOS_POLIZA.PAGO_INMEDIATO].includes(poliza.EstadoPoliza as any)
    ) {
      estadoNuevo = ESTADOS_POLIZA.VENCIDA;
    }

    if (estadoNuevo !== poliza.EstadoPoliza) {
      poliza.EstadoPoliza = estadoNuevo as any;
      await this.polizasRepository.save(poliza);
    }
  }

  /**
   * Actualiza masivamente los estados de todas las pólizas vigentes
   * Endpoint manual: POST /polizas/actualizar-estados
   */
  async actualizarEstadosPolizas(): Promise<any> {
    const polizas = await this.polizasRepository.find({
      where: {
        EstadoPoliza: In([
          ESTADOS_POLIZA.PENDIENTE,
          ESTADOS_POLIZA.PAGO_INMEDIATO,
          ESTADOS_POLIZA.PERIODO_GRACIA,
          ESTADOS_POLIZA.ACTIVA,
        ]),
      },
      relations: ['cotizacion'],
    });

    const actualizaciones = [];
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    for (const poliza of polizas) {
      const estadoAnterior = poliza.EstadoPoliza;
      let estadoNuevo = estadoAnterior;

      const pagosRealizados = await this.pagosPolizaRepository.count({
        where: {
          PolizaID: poliza.PolizaID,
          EstatusPago: { IDEstatusPago: 1 },
        },
      });

      const primerPagoRecibido = pagosRealizados > 0;

      const fechaInicio = new Date(poliza.FechaInicio);
      const periodoGracia = Number(poliza.cotizacion?.PeriodoGracia || 0);
      const fechaLimiteGracia = new Date(fechaInicio);
      fechaLimiteGracia.setDate(fechaLimiteGracia.getDate() + periodoGracia);

      const fechaEmision = new Date(poliza.FechaEmision);
      const fechaLimitePagoInmediato = new Date(fechaEmision);
      fechaLimitePagoInmediato.setDate(fechaLimitePagoInmediato.getDate() + 2);

      if (
        primerPagoRecibido &&
        [ESTADOS_POLIZA.PENDIENTE, ESTADOS_POLIZA.PAGO_INMEDIATO, ESTADOS_POLIZA.PERIODO_GRACIA].includes(estadoAnterior as any)
      ) {
        estadoNuevo = ESTADOS_POLIZA.ACTIVA;
      } else if (estadoAnterior === ESTADOS_POLIZA.PAGO_INMEDIATO && !primerPagoRecibido && hoy > fechaLimitePagoInmediato) {
        estadoNuevo = ESTADOS_POLIZA.VENCIDA;
      } else if (estadoAnterior === ESTADOS_POLIZA.PERIODO_GRACIA && !primerPagoRecibido && hoy > fechaLimiteGracia) {
        estadoNuevo = ESTADOS_POLIZA.VENCIDA;
      } else if (estadoAnterior === ESTADOS_POLIZA.PENDIENTE && !primerPagoRecibido && hoy > fechaLimiteGracia) {
        estadoNuevo = ESTADOS_POLIZA.VENCIDA;
      }

      if (estadoNuevo !== estadoAnterior) {
        poliza.EstadoPoliza = estadoNuevo as any;
        await this.polizasRepository.save(poliza);

        actualizaciones.push({
          polizaId: poliza.PolizaID,
          numeroPoliza: poliza.NumeroPoliza,
          estadoAnterior,
          estadoNuevo,
        });
      }
    }

    return {
      total: actualizaciones.length,
      polizas: actualizaciones,
    };
  }
}
