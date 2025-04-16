import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
  ) {}

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
    poliza.EstadoPoliza = 'PERIODO DE GRACIA'; // Estado inicial de la póliza

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
      !['ACTIVA', 'PENDIENTE', 'PERIODO DE GRACIA'].includes(
        updatePolizaDto.EstadoPoliza,
      )
    ) {
      throw new HttpException(
        'Estado de póliza no válido. Debe ser ACTIVA,PENDIENTE O EN PERIODO DE GRACIA',
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

  async generarEsquemaPagos(identificador: { folio: string }): Promise<any> {
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
}
