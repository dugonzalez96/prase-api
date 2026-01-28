import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
    Repository,
    Between,
    LessThanOrEqual,
    IsNull,
} from 'typeorm';

import { CajaGeneral } from './entities/caja-general.entity';
import { CajaChica } from 'src/caja-chica/entities/caja-chica.entity';
import { Transacciones } from 'src/transacciones/entities/transacciones.entity';
import { PagosPoliza } from 'src/pagos-poliza/entities/pagos-poliza.entity';
import { Sucursal } from 'src/sucursales/entities/sucursales.entity';
import { usuarios } from 'src/users/users.entity';
import { IniciosCaja } from 'src/inicios-caja/entities/inicios-caja.entity';

import { GetCajaGeneralDashboardDto } from './dto/get-caja-general-dashboard.dto';
import { CuadrarCajaGeneralDto } from './dto/cuadrar-caja-general.dto';
import {
    CajaGeneralDashboardResponseDto,
    CajaGeneralResumenDto,
    MovimientoTimelineDto,
    HistorialCuadreCajaGeneralDto,
} from './dto/caja-general-dashboard-response.dto';

import { CortesUsuarios } from 'src/corte-caja/entities/cortes-usuarios.entity';
import { CreateMovimientoCajaGeneralDto, GetMovimientosCajaGeneralDto } from './dto/reate-movimiento-caja-general.dto';
import { CuentasBancarias } from 'src/cuentas-bancarias/entities/cuentas-bancarias.entity';

@Injectable()
export class CajaGeneralService {
    // 🔐 Almacén temporal de códigos de autorización para cancelaciones
    private authorizationCodes: Map<number, string> = new Map();

    constructor(
        @InjectRepository(CajaGeneral, 'db1')
        private readonly cajaGeneralRepo: Repository<CajaGeneral>,

        @InjectRepository(CajaChica, 'db1')
        private readonly cajaChicaRepo: Repository<CajaChica>,

        @InjectRepository(CortesUsuarios, 'db1')
        private readonly cortesUsuariosRepo: Repository<CortesUsuarios>,

        @InjectRepository(Transacciones, 'db1')
        private readonly transaccionesRepo: Repository<Transacciones>,

        @InjectRepository(PagosPoliza, 'db1')
        private readonly pagosPolizaRepo: Repository<PagosPoliza>,

        @InjectRepository(Sucursal, 'db1')
        private readonly sucursalRepo: Repository<Sucursal>,

        @InjectRepository(usuarios, 'db1')
        private readonly usuariosRepo: Repository<usuarios>,

        @InjectRepository(CuentasBancarias, 'db1')
        private readonly cuentasBancariasRepo: Repository<CuentasBancarias>,

        @InjectRepository(IniciosCaja, 'db1')
        private readonly iniciosCajaRepo: Repository<IniciosCaja>,
    ) { }

    // 🌍 MÉTODO AUXILIAR: Obtener timezone de la sucursal
    private async getTimezoneForSucursal(sucursalId?: number): Promise<string> {
        if (!sucursalId) {
            // Default para Nayarit (Tepic - Zona Montaña)
            return '-07:00';
        }

        const sucursal = await this.sucursalRepo.findOne({
            where: { SucursalID: sucursalId },
            select: ['SucursalID', 'Timezone']
        });

        if (!sucursal?.Timezone) {
            console.warn(`⚠️ Sucursal ${sucursalId} sin timezone configurado, usando default -07:00`);
            return '-07:00';
        }

        // Mapeo de timezones
        const timezoneMap: Record<string, string> = {
            'America/Mazatlan': '-07:00',        // Tepic, Compostela (Zona Montaña)
            'America/Mexico_City': '-06:00',     // Bahía de Banderas (Zona Centro)
            'America/Hermosillo': '-07:00',      // Sonora (sin DST)
            'America/Chihuahua': '-06:00',       // Chihuahua
            'America/Tijuana': '-08:00',         // Baja California
        };

        const offset = timezoneMap[sucursal.Timezone] || '-07:00';

        console.log(`🌍 Timezone para sucursal ${sucursalId}: ${sucursal.Timezone} → ${offset}`);

        return offset;
    }

    // 🌍 MÉTODO AUXILIAR: Convertir fecha UTC a hora local
    private convertUTCToLocal(dateUTC: Date, timezoneOffset: string): Date {
        if (!dateUTC) return dateUTC;

        // Parsear el offset (ej: "-07:00" o "-06:00")
        const [hours, minutes] = timezoneOffset.split(':').map(Number);
        const offsetMinutes = hours * 60 + (hours < 0 ? -minutes : minutes);

        // Crear nueva fecha ajustada a hora local
        const localDate = new Date(dateUTC.getTime() + offsetMinutes * 60000);
        return localDate;
    }

    // 🌍 MÉTODO AUXILIAR: Extraer hora local en formato HH:mm
    private getLocalTimeString(dateUTC: Date, timezoneOffset: string): string {
        if (!dateUTC) return '00:00';

        const localDate = this.convertUTCToLocal(dateUTC, timezoneOffset);
        const hours = localDate.getUTCHours().toString().padStart(2, '0');
        const mins = localDate.getUTCMinutes().toString().padStart(2, '0');
        return `${hours}:${mins}`;
    }

    // 📊 DASHBOARD COMPLETO (incluye pre-cuadre)
    async getDashboard(dto: GetCajaGeneralDashboardDto) {
        const { fecha, sucursalId } = dto;

        console.log('🔍 Consultando dashboard para fecha:', fecha);

        // 🌍 Obtener timezone de la sucursal
        const timezone = await this.getTimezoneForSucursal(sucursalId);
        console.log(`🌍 Usando timezone: ${timezone} para consultas`);

        // 1) Saldo inicial: último cuadre CERRADO antes de la fecha
        const ultimoCuadre = await this.cajaGeneralRepo
            .createQueryBuilder('cg')
            .leftJoinAndSelect('cg.Sucursal', 'sucursal')
            .leftJoinAndSelect('cg.UsuarioCuadre', 'usuario')
            .where("DATE(CONVERT_TZ(cg.Fecha, '+00:00', :timezone)) < :fecha", { fecha, timezone })
            .andWhere('cg.Estatus = :estatus', { estatus: 'Cerrado' })
            .andWhere(sucursalId ? 'sucursal.SucursalID = :sucursalId' : '1=1', { sucursalId })
            .orderBy('cg.Fecha', 'DESC')
            .getOne();

        const saldoInicial = ultimoCuadre?.SaldoFinal || 0;

        // 2.1 Cajas chicas cerradas
        const cajasChica = await this.cajaChicaRepo
            .createQueryBuilder('cc')
            .leftJoinAndSelect('cc.Sucursal', 'sucursal')
            .leftJoinAndSelect('cc.UsuarioCuadre', 'usuario')
            .where("DATE(CONVERT_TZ(cc.FechaCierre, '+00:00', :timezone)) = :fecha", { fecha, timezone })
            .andWhere('cc.Estatus = :estatus', { estatus: 'Cerrado' })
            .andWhere(sucursalId ? 'sucursal.SucursalID = :sucursalId' : '1=1', { sucursalId })
            .orderBy('cc.FechaCierre', 'ASC')
            .getMany();

        console.log('📊 Cajas chicas encontradas:', cajasChica.length);

        const entradasTimeline: MovimientoTimelineDto[] = [];
        const entradasCortesCajaChica: MovimientoTimelineDto[] = [];
        const entradasPagosPoliza: MovimientoTimelineDto[] = [];
        const entradasTransaccionesIngreso: MovimientoTimelineDto[] = [];

        cajasChica.forEach((cc) => {
            // 💵 ✅ CORRECCIÓN: Usar TotalEfectivoCapturado en lugar de TotalEfectivo
            // TotalEfectivoCapturado = efectivo físico que el usuario entregó en el cuadre
            // TotalEfectivo = cálculo automático que puede incluir otros conceptos
            // Tarjeta y transferencia están en el banco, NO en caja física
            const montoEntrega = Number(cc.TotalEfectivoCapturado || 0);

            const mov: MovimientoTimelineDto = {
                // ✅ CORRECCIÓN TIMEZONE: Usar conversión a hora local
                hora: cc.FechaCierre
                    ? this.getLocalTimeString(cc.FechaCierre, timezone)
                    : '00:00',
                tipo: 'CORTE_CAJA_CHICA',
                sucursalId: cc.Sucursal?.SucursalID ?? null,
                nombreSucursal: cc.Sucursal?.NombreSucursal ?? null,
                referencia: cc.FolioCierre || `CajaChicaID ${cc.CajaChicaID}`,
                descripcion: `Corte caja chica ${cc.Sucursal?.NombreSucursal || ''}`,
                monto: montoEntrega,
            };

            entradasTimeline.push(mov);
            entradasCortesCajaChica.push(mov);
        });

        // 2.2 Pagos póliza
        const pagos = await this.pagosPolizaRepo
            .createQueryBuilder('p')
            .leftJoinAndSelect('p.Usuario', 'usuario')
            .where("DATE(CONVERT_TZ(p.FechaPago, '+00:00', :timezone)) = :fecha", { fecha, timezone })
            .orderBy('p.FechaPago', 'ASC')
            .getMany();

        console.log('📊 Pagos póliza encontrados:', pagos.length);

        pagos.forEach((pago) => {
            const mov: MovimientoTimelineDto = {
                // ✅ CORRECCIÓN TIMEZONE: Usar conversión a hora local
                hora: pago.FechaPago
                    ? this.getLocalTimeString(pago.FechaPago, timezone)
                    : '00:00',
                tipo: 'PAGO_POLIZA',
                sucursalId: null,
                nombreSucursal: null,
                referencia: `Pago póliza ${pago.PolizaID || ''}`,
                descripcion: pago.ReferenciaPago || '',
                monto: Number(pago.MontoPagado || 0),
            };
            entradasPagosPoliza.push(mov);
        });

        // 2.3 Transacciones ingreso general - ✅ CORRECCIÓN: SOLO EFECTIVO
        // Caja general maneja solo efectivo físico. Tarjeta/transferencia van al banco.
        const transIngresos = await this.transaccionesRepo
            .createQueryBuilder('t')
            .leftJoinAndSelect('t.CuentaBancaria', 'cuenta')
            .where("DATE(CONVERT_TZ(t.FechaTransaccion, '+00:00', :timezone)) = :fecha", { fecha, timezone })
            .andWhere('t.TipoTransaccion = :tipo', { tipo: 'Ingreso' })
            .andWhere('t.EsGeneral = :esGeneral', { esGeneral: true })
            .andWhere('t.FormaPago = :formaPago', { formaPago: 'Efectivo' })
            .orderBy('t.FechaTransaccion', 'ASC')
            .getMany();

        console.log('📊 Transacciones ingreso (SOLO EFECTIVO) encontradas:', transIngresos.length);

        transIngresos.forEach((t) => {
            const mov: MovimientoTimelineDto = {
                // ✅ CORRECCIÓN TIMEZONE: Usar conversión a hora local
                hora: this.getLocalTimeString(t.FechaTransaccion, timezone),
                tipo: 'TRANSACCION_INGRESO',
                sucursalId: null,
                nombreSucursal: null,
                referencia: t.Descripcion || '',
                descripcion: t.Descripcion || '',
                monto: Number(t.Monto || 0),
            };

            entradasTimeline.push(mov);
            entradasTransaccionesIngreso.push(mov);
        });

        // ✅ CORRECCIÓN P7: Redondear a 2 decimales para evitar problemas de precisión
        const totalEntradas = Number((
            entradasCortesCajaChica.reduce((acc, mov) => acc + mov.monto, 0) +
            entradasTransaccionesIngreso.reduce((acc, mov) => acc + mov.monto, 0)
        ).toFixed(2));

        // 3) EGRESOS - ✅ CORRECCIÓN: SOLO EFECTIVO
        // Caja general maneja solo efectivo físico. Tarjeta/transferencia van al banco.
        const egresosTimeline: MovimientoTimelineDto[] = [];
        const egresosTransacciones: MovimientoTimelineDto[] = [];

        const transEgresos = await this.transaccionesRepo
            .createQueryBuilder('t')
            .leftJoinAndSelect('t.CuentaBancaria', 'cuenta')
            .where("DATE(CONVERT_TZ(t.FechaTransaccion, '+00:00', :timezone)) = :fecha", { fecha, timezone })
            .andWhere('t.TipoTransaccion = :tipo', { tipo: 'Egreso' })
            .andWhere('t.EsGeneral = :esGeneral', { esGeneral: true })
            .andWhere('t.FormaPago = :formaPago', { formaPago: 'Efectivo' })
            .orderBy('t.FechaTransaccion', 'ASC')
            .getMany();

        console.log('📊 Transacciones egreso (SOLO EFECTIVO) encontradas:', transEgresos.length);

        transEgresos.forEach((t) => {
            const mov: MovimientoTimelineDto = {
                // ✅ CORRECCIÓN TIMEZONE: Usar conversión a hora local
                hora: this.getLocalTimeString(t.FechaTransaccion, timezone),
                tipo: 'TRANSACCION_EGRESO',
                sucursalId: null,
                nombreSucursal: null,
                referencia: t.Descripcion || '',
                descripcion: t.Descripcion || '',
                monto: Number(t.Monto || 0),
            };
            egresosTimeline.push(mov);
            egresosTransacciones.push(mov);
        });

        // ✅ CORRECCIÓN P7: Redondear a 2 decimales
        const totalEgresos = Number(egresosTimeline.reduce(
            (acc, mov) => acc + mov.monto,
            0,
        ).toFixed(2));

        // ✅ CORRECCIÓN P7: Redondear saldo calculado a 2 decimales
        const saldoCalculado = Number((saldoInicial + totalEntradas - totalEgresos).toFixed(2));
        const diferencia = 0;

        let estadoCuadre: 'PRE_CUADRE' | 'CUADRADO' | 'CON_DIFERENCIA' = 'PRE_CUADRE';

        const cuadreDelDia = await this.cajaGeneralRepo
            .createQueryBuilder('cg')
            .leftJoinAndSelect('cg.Sucursal', 'sucursal')
            .where("DATE(CONVERT_TZ(cg.Fecha, '+00:00', :timezone)) = :fecha", { fecha, timezone })
            .andWhere('cg.Estatus = :estatus', { estatus: 'Cerrado' })
            .andWhere(sucursalId ? 'sucursal.SucursalID = :sucursalId' : '1=1', { sucursalId })
            .getOne();

        if (cuadreDelDia) {
            estadoCuadre = 'CUADRADO';
            if (Number(cuadreDelDia.Diferencia || 0) !== 0) {
                estadoCuadre = 'CON_DIFERENCIA';
            }
        }

        const resumen: CajaGeneralResumenDto = {
            saldoInicial,
            totalEntradas,
            totalEgresos,
            saldoCalculado,
            estadoCuadre,
        };

        // 5) CortesUsuarios
        const cortesUsuariosRaw = await this.cortesUsuariosRepo
            .createQueryBuilder('c')
            .leftJoinAndSelect('c.Sucursal', 'sucursal')
            .leftJoinAndSelect('c.usuarioID', 'usuario')
            .where("DATE(CONVERT_TZ(c.FechaCorte, '+00:00', :timezone)) = :fecha", { fecha, timezone })
            .andWhere(sucursalId ? 'sucursal.SucursalID = :sucursalId' : '1=1', { sucursalId })
            .orderBy('c.FechaCorte', 'DESC')
            .getMany();

        console.log('📊 Cortes usuarios encontrados:', cortesUsuariosRaw.length);

        // ✅ CORRECCIÓN: Convertir fechas UTC a hora local para mostrar correctamente
        // ⭐ NUEVO: Agregar desglose por forma de pago
        const cortesUsuarios = cortesUsuariosRaw.map((c) => ({
            usuario: c.usuarioID?.NombreUsuario || '',
            usuarioId: c.usuarioID?.UsuarioID || null,
            sucursalId: c.Sucursal?.SucursalID ?? null,
            nombreSucursal: c.Sucursal?.NombreSucursal ?? null,
            fechaHoraCorte: this.convertUTCToLocal(c.FechaCorte, timezone),
            montoCorte: Number(c.TotalIngresos || 0),
            estadoCajaChica: c.Estatus,
            estadoCajaGeneral: cuadreDelDia ? 'Aplicado' : 'Pendiente',
            // ⭐ NUEVO DESGLOSE POR FORMA DE PAGO
            efectivoEntregado: Number(c.TotalEfectivoCapturado || 0),
            transferencias: Number(c.TotalTransferenciaCapturado || 0),
            tarjeta: Number(c.TotalTarjetaCapturado || 0),
            depositos: 0, // Por ahora 0, se puede agregar TotalDepositoCapturado si existe
        }));

        // 6) Inicios
        const inicios = await this.iniciosCajaRepo
            .createQueryBuilder('i')
            .leftJoinAndSelect('i.Sucursal', 'sucursal')
            .leftJoinAndSelect('i.Usuario', 'usuario')
            .where("DATE(CONVERT_TZ(i.FechaInicio, '+00:00', :timezone)) = :fecha", { fecha, timezone })
            .andWhere(sucursalId ? 'sucursal.SucursalID = :sucursalId' : '1=1', { sucursalId })
            .orderBy('i.FechaInicio', 'ASC')
            .getMany();

        console.log('📊 Inicios encontrados:', inicios.length);

        // ✅ CORRECCIÓN: Convertir fechas UTC a hora local para mostrar correctamente
        const iniciosUsuarios = inicios.map((i) => ({
            usuario: i.Usuario?.NombreUsuario || '',
            usuarioId: i.Usuario?.UsuarioID || null,
            sucursalId: i.Sucursal?.SucursalID ?? null,
            nombreSucursal: i.Sucursal?.NombreSucursal ?? null,
            fechaInicio: this.convertUTCToLocal(i.FechaInicio, timezone),
            montoInicio: Number(i.MontoInicial || 0),
            estado: i.Estatus,
        }));

        // ⭐ NUEVO: Calcular totales por forma de pago desde los cortes del día
        const totalEfectivoCapturadoCortes = cortesUsuariosRaw.reduce(
            (sum, c) => sum + Number(c.TotalEfectivoCapturado || 0),
            0
        );
        const totalTarjetaCapturadoCortes = cortesUsuariosRaw.reduce(
            (sum, c) => sum + Number(c.TotalTarjetaCapturado || 0),
            0
        );
        const totalTransferenciaCapturadoCortes = cortesUsuariosRaw.reduce(
            (sum, c) => sum + Number(c.TotalTransferenciaCapturado || 0),
            0
        );

        const preCuadre = {
            saldoInicial,
            totalEntradas,
            totalEgresos,
            saldoCalculado,
            diferencia,
            // ⭐ NUEVO: Prellenar totales por forma de pago
            totalEfectivoCapturado: totalEfectivoCapturadoCortes,
            totalTarjetaCapturado: totalTarjetaCapturadoCortes,
            totalTransferenciaCapturado: totalTransferenciaCapturadoCortes,
        };

        // 8) Historial cuadres
        const historialRegistros = await this.cajaGeneralRepo.find({
            relations: ['Sucursal', 'UsuarioCuadre'],
            order: { Fecha: 'DESC' },
            take: 50,
        });

        // ✅ CORRECCIÓN: Convertir fechas UTC a hora local para mostrar correctamente
        // ✅ CORRECCIÓN P10: Agregar campo "entrego" y "diferencia"
        const historialCuadres: HistorialCuadreCajaGeneralDto[] =
            historialRegistros.map((cg) => {
                const saldoInicialHist = Number(cg.SaldoAnterior || 0);
                const totalEntradasHist = Number(cg.TotalIngresos || 0);
                const totalEgresosHist = Number(cg.TotalEgresos || 0);
                const entrego = Number(cg.SaldoReal || cg.SaldoFinal || 0);
                const saldoEsperado = Number(cg.SaldoEsperado || 0);
                // diferencia = lo que entregó - lo que debía entregar
                const diferencia = Number((entrego - saldoEsperado).toFixed(2));

                return {
                    cajaGeneralId: cg.CajaGeneralID,
                    fecha: this.convertUTCToLocal(cg.Fecha, timezone),
                    sucursalId: cg.Sucursal?.SucursalID || null,
                    nombreSucursal: cg.Sucursal?.NombreSucursal || null,
                    saldoInicial: saldoInicialHist,
                    totalEntradas: totalEntradasHist,
                    totalEgresos: totalEgresosHist,
                    saldoFinal: Number(cg.SaldoFinal || 0),
                    entrego,
                    diferencia,
                    observaciones: cg.Observaciones || null,
                    usuarioCuadre: cg.UsuarioCuadre?.NombreUsuario || null,
                    estatus: cg.Estatus,
                };
            });

        console.log('✅ Dashboard generado exitosamente');

        const respuesta: CajaGeneralDashboardResponseDto = {
            filtros: { fecha, sucursalId },
            resumen,
            entradas: entradasTimeline,
            egresos: egresosTimeline,
            entradasDetalle: {
                cortesCajaChica: entradasCortesCajaChica,
                pagosPoliza: entradasPagosPoliza,
                transaccionesIngreso: entradasTransaccionesIngreso,
            },
            egresosDetalle: {
                transaccionesEgreso: egresosTransacciones,
            },
            cortesUsuarios,
            iniciosUsuarios,
            preCuadre,
            historialCuadres,
        };

        return respuesta;
    }

    // 📊 SERVICIO SEPARADO PARA PRE-CUADRE
    async getPreCuadre(
        dto: GetCajaGeneralDashboardDto,
    ): Promise<{
        filtros: { fecha: string; sucursalId?: number };
        preCuadre: {
            saldoInicial: number;
            totalEntradas: number;
            totalEgresos: number;
            saldoCalculado: number;
            diferencia: number;
            // ⭐ NUEVO: Prellenar totales por forma de pago
            totalEfectivoCapturado: number;
            totalTarjetaCapturado: number;
            totalTransferenciaCapturado: number;
        };
        entradasDetalle: CajaGeneralDashboardResponseDto['entradasDetalle'];
        egresosDetalle: CajaGeneralDashboardResponseDto['egresosDetalle'];

        analitica: {
            ultimoCuadreFecha: Date | null;
            ultimoCuadreSaldoFinal: number;
            promedioUltimosCuadres: {
                diasConsiderados: number;
                totalEntradas: number;
                totalEgresos: number;
                saldoFinal: number;
            };
            variacionVsPromedio: {
                totalEntradasPct: number | null;
                totalEgresosPct: number | null;
                saldoCalculadoPct: number | null;
            } | null;
        };

        puedeCuadrarHoy: boolean;
        yaCuadradoHoy: boolean;
        motivosBloqueo: string[];
    }> {
        const { fecha, sucursalId } = dto;

        console.log('🔍 Consultando pre-cuadre para fecha:', fecha);

        // 🌍 Obtener timezone de la sucursal
        const timezone = await this.getTimezoneForSucursal(sucursalId);
        console.log(`🌍 Usando timezone: ${timezone} para pre-cuadre`);

        // Convertir fecha a rango UTC usando el timezone de la sucursal
        const [year, month, day] = fecha.split('-').map(Number);
        const startLocal = new Date(year, month - 1, day, 0, 0, 0, 0);
        const endLocal = new Date(year, month - 1, day, 23, 59, 59, 999);

        // Ajustar según el timezone
        const timezoneOffsetMinutes = parseInt(timezone.split(':')[0]) * 60;
        const start = new Date(startLocal.getTime() - timezoneOffsetMinutes * 60000);
        const end = new Date(endLocal.getTime() - timezoneOffsetMinutes * 60000);

        console.log('📅 Rango local interpretado:', {
            inicio: startLocal.toString(),
            fin: endLocal.toString(),
            inicioUTC: start.toISOString(),
            finUTC: end.toISOString(),
        });

        // Foto del día (esto ya trae preCuadre armado con 0 si no hay nada)
        const dashboard = await this.getDashboard({ fecha, sucursalId });

        // 1) ¿Ya existe cuadre de hoy?
        const cuadreHoy = await this.cajaGeneralRepo
            .createQueryBuilder('cg')
            .leftJoinAndSelect('cg.Sucursal', 'sucursal')
            .leftJoinAndSelect('cg.UsuarioCuadre', 'usuario')
            .where("DATE(CONVERT_TZ(cg.Fecha, '+00:00', :timezone)) = :fecha", { fecha, timezone })
            .andWhere('cg.Estatus = :estatus', { estatus: 'Cerrado' })
            .andWhere(sucursalId ? 'sucursal.SucursalID = :sucursalId' : '1=1', { sucursalId })
            .getOne();

        const yaCuadradoHoy = !!cuadreHoy;

        const motivosBloqueo: string[] = [];
        let puedeCuadrarHoy = true;

        if (yaCuadradoHoy) {
            puedeCuadrarHoy = false;
            motivosBloqueo.push(
                'Ya existe un cuadre de Caja General para esta fecha. Solo se permite un cuadre por día.',
            );
        }

        // 2) Analítica vs cuadres anteriores
        const historico = await this.cajaGeneralRepo
            .createQueryBuilder('cg')
            .leftJoinAndSelect('cg.Sucursal', 'sucursal')
            .where("DATE(CONVERT_TZ(cg.Fecha, '+00:00', :timezone)) < :fecha", { fecha, timezone })
            .andWhere('cg.Estatus = :estatus', { estatus: 'Cerrado' })
            .andWhere(sucursalId ? 'sucursal.SucursalID = :sucursalId' : '1=1', { sucursalId })
            .orderBy('cg.Fecha', 'DESC')
            .take(7)
            .getMany();

        const ultimoCuadre = historico.length > 0 ? historico[0] : null;
        const diasConsiderados = historico.length;

        let promedioTotalEntradas = 0;
        let promedioTotalEgresos = 0;
        let promedioSaldoFinal = 0;

        if (diasConsiderados > 0) {
            promedioTotalEntradas =
                historico.reduce(
                    (acc, c) => acc + Number(c.TotalIngresos ?? 0),
                    0,
                ) / diasConsiderados;

            promedioTotalEgresos =
                historico.reduce(
                    (acc, c) => acc + Number(c.TotalEgresos ?? 0),
                    0,
                ) / diasConsiderados;

            promedioSaldoFinal =
                historico.reduce(
                    (acc, c) => acc + Number(c.SaldoFinal ?? 0),
                    0,
                ) / diasConsiderados;
        }

        const pre = dashboard.preCuadre;

        const calcVarPct = (actual: number, base: number): number | null => {
            if (!base || base === 0) return null;
            return ((actual - base) / base) * 100;
        };

        const variacionVsPromedio =
            diasConsiderados > 0
                ? {
                    totalEntradasPct: calcVarPct(
                        pre.totalEntradas,
                        promedioTotalEntradas,
                    ),
                    totalEgresosPct: calcVarPct(
                        pre.totalEgresos,
                        promedioTotalEgresos,
                    ),
                    saldoCalculadoPct: calcVarPct(
                        pre.saldoCalculado,
                        promedioSaldoFinal,
                    ),
                }
                : null;

        const analitica = {
            ultimoCuadreFecha: ultimoCuadre?.Fecha ?? null,
            ultimoCuadreSaldoFinal: Number(ultimoCuadre?.SaldoFinal ?? 0),
            promedioUltimosCuadres: {
                diasConsiderados,
                totalEntradas: promedioTotalEntradas,
                totalEgresos: promedioTotalEgresos,
                saldoFinal: promedioSaldoFinal,
            },
            variacionVsPromedio,
        };

        console.log('✅ Pre-cuadre generado exitosamente');

        // ⚠️ Aquí es donde garantizamos estructura y defaults:
        return {
            filtros: {
                fecha: dashboard.filtros.fecha,
                sucursalId: dashboard.filtros.sucursalId,
            },
            preCuadre: {
                saldoInicial: pre.saldoInicial ?? 0,
                totalEntradas: pre.totalEntradas ?? 0,
                totalEgresos: pre.totalEgresos ?? 0,
                saldoCalculado: pre.saldoCalculado ?? 0,
                diferencia: pre.diferencia ?? 0,
                // ⭐ NUEVO: Prellenar totales por forma de pago
                totalEfectivoCapturado: pre.totalEfectivoCapturado ?? 0,
                totalTarjetaCapturado: pre.totalTarjetaCapturado ?? 0,
                totalTransferenciaCapturado: pre.totalTransferenciaCapturado ?? 0,
            },
            entradasDetalle: {
                cortesCajaChica:
                    dashboard.entradasDetalle?.cortesCajaChica ?? [],
                pagosPoliza: dashboard.entradasDetalle?.pagosPoliza ?? [],
                transaccionesIngreso:
                    dashboard.entradasDetalle?.transaccionesIngreso ?? [],
            },
            egresosDetalle: {
                transaccionesEgreso:
                    dashboard.egresosDetalle?.transaccionesEgreso ?? [],
            },
            analitica,
            puedeCuadrarHoy,
            yaCuadradoHoy,
            motivosBloqueo,
        };
    }

    /**
     * 🔍 VALIDACIÓN CRÍTICA GLOBAL: Usuarios con movimientos SIN corte CERRADO
     *
     * REGLA DE NEGOCIO (FASE 1):
     * "La caja general no se debe poder cuadrar si existe algún usuario (de cualquier sucursal)
     * que haya tenido movimientos durante el día y que no se le haya realizado el corte respectivo."
     *
     * DIFERENCIA vs Caja Chica: Esta validación es GLOBAL (todas las sucursales)
     *
     * @param fecha - Fecha del cuadre en formato YYYY-MM-DD
     * @param sucursalId - ID de la sucursal (opcional, para obtener timezone correcto)
     * @returns Lista de usuarios con movimientos sin corte (agrupados por sucursal)
     */
    private async getUsuariosConMovimientosSinCorteGlobal(fecha: string, sucursalId?: number) {
        console.log('🌍 Validando usuarios con movimientos sin corte GLOBAL');
        console.log(`   Fecha: ${fecha}`);

        // 1️⃣ Obtener rango de fechas del día (usando timezone de la sucursal si se proporciona)
        const { startUTC, endUTC } = await this.getLocalDayRangeToUTCWithTimezone(fecha, sucursalId);

        console.log(`   Ventana: ${startUTC.toISOString()} → ${endUTC.toISOString()}`);

        // 2️⃣ Buscar usuarios con TRANSACCIONES DE CAJA CHICA en el día
        // ✅ CORRECCIÓN: Solo contar transacciones de caja chica (EsGeneral = false)
        // Las transacciones de caja general NO requieren corte de usuario
        const transacciones = await this.transaccionesRepo
            .createQueryBuilder('t')
            .leftJoin('t.UsuarioCreo', 'u')
            .leftJoin('Sucursales', 's', 's.SucursalID = u.SucursalID')
            .where('t.FechaTransaccion BETWEEN :startUTC AND :endUTC', { startUTC, endUTC })
            .andWhere('(t.EsGeneral = :esGeneral OR t.EsGeneral IS NULL)', { esGeneral: false })
            .select('u.UsuarioID', 'UsuarioID')
            .addSelect('u.NombreUsuario', 'NombreUsuario')
            .addSelect('s.SucursalID', 'SucursalID')
            .addSelect('s.NombreSucursal', 'NombreSucursal')
            .distinct(true)
            .getRawMany();

        console.log(`   📝 ${transacciones.length} usuarios con transacciones`);

        // 3️⃣ Buscar TODOS los usuarios con PAGOS DE PÓLIZA en el día
        const pagosPoliza = await this.pagosPolizaRepo
            .createQueryBuilder('p')
            .leftJoin('p.Usuario', 'u')
            .leftJoin('Sucursales', 's', 's.SucursalID = u.SucursalID')
            .where('p.FechaPago BETWEEN :startUTC AND :endUTC', { startUTC, endUTC })
            .andWhere('p.MotivoCancelacion IS NULL')
            .select('u.UsuarioID', 'UsuarioID')
            .addSelect('u.NombreUsuario', 'NombreUsuario')
            .addSelect('s.SucursalID', 'SucursalID')
            .addSelect('s.NombreSucursal', 'NombreSucursal')
            .distinct(true)
            .getRawMany();

        console.log(`   💳 ${pagosPoliza.length} usuarios con pagos de póliza`);

        // 4️⃣ UNION: Usuarios con movimientos (transacciones O pagos)
        const movimientosMap = new Map<number, { UsuarioID: number; NombreUsuario: string; SucursalID: number; NombreSucursal: string }>();

        transacciones.forEach((t) => {
            if (t.UsuarioID) {
                movimientosMap.set(t.UsuarioID, {
                    UsuarioID: t.UsuarioID,
                    NombreUsuario: t.NombreUsuario,
                    SucursalID: t.SucursalID,
                    NombreSucursal: t.NombreSucursal,
                });
            }
        });

        pagosPoliza.forEach((p) => {
            if (p.UsuarioID) {
                movimientosMap.set(p.UsuarioID, {
                    UsuarioID: p.UsuarioID,
                    NombreUsuario: p.NombreUsuario,
                    SucursalID: p.SucursalID,
                    NombreSucursal: p.NombreSucursal,
                });
            }
        });

        if (movimientosMap.size === 0) {
            console.log('   ✅ No hay usuarios con movimientos en el día');
            return [];
        }

        console.log(`   📊 TOTAL: ${movimientosMap.size} usuarios con movimientos (todas las sucursales)`);

        // 5️⃣ Buscar usuarios con CORTES CERRADOS en el día (todas las sucursales)
        const cortesCerrados = await this.cortesUsuariosRepo
            .createQueryBuilder('c')
            .leftJoin('c.usuarioID', 'u')
            .where('c.FechaCorte BETWEEN :startUTC AND :endUTC', { startUTC, endUTC })
            .andWhere('c.Estatus = :estatus', { estatus: 'Cerrado' })
            .select('u.UsuarioID', 'UsuarioID')
            .getRawMany();

        const usuariosConCorteCerrado = new Set(
            cortesCerrados.map((c) => c.UsuarioID),
        );

        console.log(`   ✅ ${usuariosConCorteCerrado.size} usuarios con corte CERRADO`);

        // 6️⃣ FILTRAR: Usuarios con movimientos pero SIN corte cerrado
        const usuariosSinCorte = Array.from(movimientosMap.values()).filter(
            (usuario) => !usuariosConCorteCerrado.has(usuario.UsuarioID),
        );

        if (usuariosSinCorte.length === 0) {
            console.log('   ✅ Todos los usuarios con movimientos tienen corte cerrado');
            return [];
        }

        console.log(`   ❌ ${usuariosSinCorte.length} usuarios con movimientos SIN corte cerrado`);

        // 7️⃣ Agrupar por sucursal para mejor visualización
        const usuariosPorSucursal = usuariosSinCorte.reduce((acc, usuario) => {
            const sucursalNombre = usuario.NombreSucursal || 'Sin sucursal';
            if (!acc[sucursalNombre]) {
                acc[sucursalNombre] = [];
            }
            acc[sucursalNombre].push({
                UsuarioID: usuario.UsuarioID,
                Nombre: usuario.NombreUsuario,
            });
            return acc;
        }, {} as Record<string, Array<{ UsuarioID: number; Nombre: string }>>);

        console.log(`   🚨 Usuarios por sucursal que bloquean el cuadre:`, usuariosPorSucursal);

        return usuariosSinCorte.map((u) => ({
            UsuarioID: u.UsuarioID,
            Nombre: u.NombreUsuario,
            SucursalID: u.SucursalID,
            NombreSucursal: u.NombreSucursal,
        }));
    }

    // CUADRAR CAJA GENERAL
    // CUADRAR CAJA GENERAL
    async cuadrarCajaGeneral(dto: CuadrarCajaGeneralDto): Promise<CajaGeneral> {
        const {
            fecha,
            sucursalId,
            usuarioCuadreId,
            observaciones,
            folioCierre,
            saldoReal,
            totalEfectivoCapturado,
            totalTarjetaCapturado,
            totalTransferenciaCapturado,
        } = dto;

        const { startUTC, endUTC } = this.getLocalDayRangeToUTC(fecha);

        // El pre-cuadre se calcula GLOBAL
        const dashboard = await this.getDashboard({ fecha, sucursalId: undefined });

        const sucursal = sucursalId
            ? await this.sucursalRepo.findOne({
                where: { SucursalID: sucursalId },
            })
            : null;

        const usuarioCuadre = await this.usuariosRepo.findOne({
            where: { UsuarioID: usuarioCuadreId },
        });

        if (!usuarioCuadre) {
            throw new HttpException(
                'Usuario de cuadre no encontrado',
                HttpStatus.NOT_FOUND,
            );
        }

        // 🔒 VALIDACIÓN: No permitir crear cuadre si ya existe uno activo para el día
        // Solo bloquear si el estatus es 'Cerrado' o 'Pendiente' (los cancelados permiten crear nuevo)
        const cuadreExistente = await this.cajaGeneralRepo
            .createQueryBuilder('cg')
            .leftJoin('cg.Sucursal', 'sucursal')
            .where('cg.Fecha BETWEEN :startUTC AND :endUTC', { startUTC, endUTC })
            .andWhere('cg.Estatus IN (:...estatusBloquean)', { estatusBloquean: ['Cerrado', 'Pendiente'] })
            .andWhere(sucursalId ? 'sucursal.SucursalID = :sucursalId' : '1=1', { sucursalId })
            .getOne();

        if (cuadreExistente) {
            throw new HttpException(
                `❌ Ya existe un cuadre de caja general con estatus '${cuadreExistente.Estatus}' para la fecha ${fecha}. ` +
                `Solo se permite un cuadre activo por día. Si necesita crear uno nuevo, primero cancele el existente.`,
                HttpStatus.BAD_REQUEST,
            );
        }

        // 🔍 VALIDACIÓN CRÍTICA FASE 1: Usuarios con movimientos sin corte CERRADO
        console.log('🔍 ===== VALIDANDO PREREQUISITOS PARA CUADRE DE CAJA GENERAL =====');
        const usuariosSinCorte = await this.getUsuariosConMovimientosSinCorteGlobal(fecha, sucursalId);

        if (usuariosSinCorte.length > 0) {
            // Agrupar por sucursal para mensaje más claro
            const porSucursal = usuariosSinCorte.reduce((acc, u) => {
                const sucursal = u.NombreSucursal || 'Sin sucursal';
                if (!acc[sucursal]) acc[sucursal] = [];
                acc[sucursal].push(`${u.Nombre} (ID: ${u.UsuarioID})`);
                return acc;
            }, {} as Record<string, string[]>);

            const mensaje = Object.entries(porSucursal)
                .map(([sucursal, usuarios]) => `\n  • ${sucursal}: ${usuarios.join(', ')}`)
                .join('');

            throw new HttpException(
                `❌ No se puede cuadrar Caja General: Existen ${usuariosSinCorte.length} usuario(s) con movimientos SIN corte CERRADO del día ${fecha}:${mensaje}\n\n` +
                `ACCIÓN REQUERIDA: Todos los usuarios con movimientos deben tener su corte de caja CERRADO antes de cuadrar la Caja General.`,
                HttpStatus.BAD_REQUEST,
            );
        }

        console.log('✅ Validación exitosa: Todos los usuarios con movimientos tienen corte cerrado');

        const saldoCalculado = dashboard.preCuadre.saldoCalculado;
        const saldoRealUsado =
            typeof saldoReal === 'number' ? saldoReal : saldoCalculado;

        // 💵 DIFERENCIA SOLO DE EFECTIVO: Comparar efectivo real vs efectivo esperado
        // Si se proporciona totalEfectivoCapturado, usarlo; sino, usar saldoRealUsado (por compatibilidad)
        const efectivoCapturado = typeof totalEfectivoCapturado === 'number' ? totalEfectivoCapturado : saldoRealUsado;
        // ✅ CORRECCIÓN P7: Redondear diferencia a 2 decimales
        const diferencia = Number((efectivoCapturado - saldoCalculado).toFixed(2));

        // ✅ VALIDACIÓN: Diferencia requiere observaciones
        if (Math.abs(diferencia) > 0.01) { // Tolerancia de 1 centavo por redondeo
            // 🔴 CUALQUIER diferencia requiere observaciones
            if (!observaciones || observaciones.trim().length === 0) {
                throw new HttpException(
                    `❌ Si existe diferencia entre el saldo esperado ($${saldoCalculado.toFixed(2)}) ` +
                    `y el saldo entregado ($${efectivoCapturado.toFixed(2)}), es obligatorio escribir ` +
                    `un comentario para justificar la diferencia de $${diferencia.toFixed(2)}. ` +
                    `Por favor, agregue una observación explicando el motivo de la diferencia.`,
                    HttpStatus.BAD_REQUEST,
                );
            }

            // Si la diferencia es > 5%, requiere observación MÁS DETALLADA
            if (saldoCalculado !== 0) {
                const porcentajeDiferencia = (Math.abs(diferencia) / Math.abs(saldoCalculado)) * 100;

                if (porcentajeDiferencia > 5) {
                    console.warn(
                        `⚠️ ADVERTENCIA CRÍTICA: Diferencia del ${porcentajeDiferencia.toFixed(2)}% en cuadre de caja general. ` +
                        `Efectivo esperado: $${saldoCalculado.toFixed(2)}, Efectivo capturado: $${efectivoCapturado.toFixed(2)}, ` +
                        `Diferencia: $${diferencia.toFixed(2)}`
                    );

                    // Diferencias grandes requieren observación más detallada
                    if (observaciones.trim().length < 15) {
                        throw new HttpException(
                            `⚠️ Se requiere una observación DETALLADA (mínimo 15 caracteres) cuando la diferencia supera el 5%. ` +
                            `Diferencia actual: $${diferencia.toFixed(2)} (${porcentajeDiferencia.toFixed(2)}%)`,
                            HttpStatus.BAD_REQUEST,
                        );
                    }
                }
            }
        }

        // ✅ VALIDACIÓN: Montos capturados no negativos
        if (typeof totalEfectivoCapturado === 'number' && totalEfectivoCapturado < 0) {
            throw new HttpException(
                '❌ El monto de efectivo capturado no puede ser negativo',
                HttpStatus.BAD_REQUEST,
            );
        }

        // 💵 VALIDACIÓN CORREGIDA: SaldoReal = SOLO EFECTIVO
        // El dinero físico que se entrega es SOLO el efectivo.
        // Tarjeta y transferencia son INFORMATIVOS (ya están en el banco).
        // Por lo tanto, SaldoReal debe coincidir SOLO con totalEfectivoCapturado.
        if (typeof totalEfectivoCapturado === 'number') {
            const diferenciaCaptura = Math.abs(saldoRealUsado - totalEfectivoCapturado);

            if (diferenciaCaptura > 0.01) {
                throw new HttpException(
                    `❌ Inconsistencia: El saldo real ($${saldoRealUsado.toFixed(2)}) debe coincidir ` +
                    `con el efectivo capturado ($${totalEfectivoCapturado.toFixed(2)}). ` +
                    `Recuerde: Solo se entrega efectivo físico. Tarjeta y transferencia son informativos.`,
                    HttpStatus.BAD_REQUEST,
                );
            }
        }

        // ℹ️ Tarjeta y transferencia son solo informativos, no se validan contra el efectivo
        // pero deben ser >= 0 si se proporcionan
        if (typeof totalTarjetaCapturado === 'number' && totalTarjetaCapturado < 0) {
            throw new HttpException(
                '❌ El monto de tarjeta capturado no puede ser negativo',
                HttpStatus.BAD_REQUEST,
            );
        }
        if (typeof totalTransferenciaCapturado === 'number' && totalTransferenciaCapturado < 0) {
            throw new HttpException(
                '❌ El monto de transferencia capturado no puede ser negativo',
                HttpStatus.BAD_REQUEST,
            );
        }

        const totalDesdeCajaChica =
            dashboard.entradasDetalle.cortesCajaChica.reduce(
                (acc, mov) => acc + mov.monto,
                0,
            );

        const cajaGeneral = new CajaGeneral();

        // La fecha se guarda usando CreateDateColumn que usa CURRENT_TIMESTAMP
        // MySQL la guarda en UTC y las consultas usan CONVERT_TZ para leer en hora local
        cajaGeneral.Sucursal = sucursal || null;

        cajaGeneral.SaldoAnterior = dashboard.resumen.saldoInicial;
        cajaGeneral.IngresosCajaChica = totalDesdeCajaChica;
        cajaGeneral.TotalIngresos = dashboard.preCuadre.totalEntradas;
        cajaGeneral.TotalEgresos = dashboard.preCuadre.totalEgresos;

        cajaGeneral.TotalEfectivo = 0;
        cajaGeneral.TotalPagoConTarjeta = 0;
        cajaGeneral.TotalTransferencia = 0;

        cajaGeneral.SaldoEsperado = saldoCalculado;
        cajaGeneral.SaldoReal = saldoRealUsado;

        cajaGeneral.TotalEfectivoCapturado =
            typeof totalEfectivoCapturado === 'number'
                ? totalEfectivoCapturado
                : null;

        cajaGeneral.TotalTarjetaCapturado =
            typeof totalTarjetaCapturado === 'number'
                ? totalTarjetaCapturado
                : null;

        cajaGeneral.TotalTransferenciaCapturado =
            typeof totalTransferenciaCapturado === 'number'
                ? totalTransferenciaCapturado
                : null;

        cajaGeneral.Diferencia = diferencia;
        cajaGeneral.SaldoFinal = saldoRealUsado;
        cajaGeneral.UsuarioCuadre = usuarioCuadre;
        cajaGeneral.FolioCierre = folioCierre || null;
        cajaGeneral.Observaciones = observaciones || null;
        cajaGeneral.Estatus = 'Cerrado';

        return this.cajaGeneralRepo.save(cajaGeneral);
    }



    async crearMovimientoCajaGeneral(
        dto: CreateMovimientoCajaGeneralDto,
    ): Promise<Transacciones> {
        const {
            tipoTransaccion,
            formaPago,
            monto,
            descripcion,
            usuarioCreoId,
            cuentaBancariaId,
            fechaTransaccion,
        } = dto;

        if (!monto || monto <= 0) {
            throw new HttpException(
                'El monto debe ser mayor a 0',
                HttpStatus.BAD_REQUEST,
            );
        }

        if (!usuarioCreoId) {
            throw new HttpException(
                'usuarioCreoId es obligatorio',
                HttpStatus.BAD_REQUEST,
            );
        }

        const usuarioCreo = await this.usuariosRepo.findOne({
            where: { UsuarioID: usuarioCreoId },
        });

        if (!usuarioCreo) {
            throw new HttpException(
                'Usuario creador no encontrado',
                HttpStatus.NOT_FOUND,
            );
        }

        let cuentaBancaria: CuentasBancarias = null;
        if (cuentaBancariaId) {
            cuentaBancaria = await this.cuentasBancariasRepo.findOne({
                where: { CuentaBancariaID: cuentaBancariaId },
            });
            if (!cuentaBancaria) {
                throw new HttpException(
                    'Cuenta bancaria no encontrada',
                    HttpStatus.NOT_FOUND,
                );
            }
        }

        const transaccion = this.transaccionesRepo.create({
            TipoTransaccion: tipoTransaccion,
            EsGeneral: true, // 👈 clave: movimiento de CAJA GENERAL
            FormaPago: formaPago,
            Monto: monto,
            Descripcion: descripcion || null,
            UsuarioCreo: usuarioCreo,
            CuentaBancaria: cuentaBancaria || null,
            InicioCaja: null, // 👈 no va ligada a caja chica
            FechaTransaccion: fechaTransaccion
                ? new Date(`${fechaTransaccion}T00:00:00`)
                : undefined, // si no se manda, TypeORM pone CURRENT_TIMESTAMP
            Validado: false,
        });

        return this.transaccionesRepo.save(transaccion);
    }

    async listarMovimientosCajaGeneral(
        dto: GetMovimientosCajaGeneralDto,
    ): Promise<Transacciones[]> {
        const { fecha, tipo } = dto;

        const { startUTC, endUTC } = this.getLocalDayRangeToUTC(fecha);

        const where: any = {
            EsGeneral: true,
            FechaTransaccion: Between(startUTC, endUTC),
        };

        if (tipo) {
            where.TipoTransaccion = tipo;
        }

        return this.transaccionesRepo.find({
            where,
            relations: ['UsuarioCreo', 'CuentaBancaria'],
            order: { FechaTransaccion: 'DESC' },
        });
    }

    /**
     * 🌍 Convertir fecha local a rango UTC usando timezone de la sucursal
     *
     * IMPORTANTE: Debe ser consistente con getTimezoneForSucursal()
     * y con el manejo de zonas horarias en caja-chica y cortes-usuarios
     *
     * @param fecha - Fecha en formato YYYY-MM-DD
     * @param sucursalId - ID de la sucursal (opcional)
     * @returns Rango UTC para búsqueda en BD
     */
    private async getLocalDayRangeToUTCWithTimezone(fecha: string, sucursalId?: number) {
        // 🌍 Obtener timezone de la sucursal
        const timezone = await this.getTimezoneForSucursal(sucursalId);

        // Parsear fecha como LOCAL
        const [year, month, day] = fecha.split('-').map(Number);

        // Crear fecha en hora local (ignorando UTC)
        const startLocal = new Date(year, month - 1, day, 0, 0, 0, 0);
        const endLocal = new Date(year, month - 1, day, 23, 59, 59, 999);

        console.log(`📅 Fecha local interpretada (timezone: ${timezone}):`, {
            inicio: startLocal.toString(),
            fin: endLocal.toString(),
        });

        // Estas fechas YA están en hora local del servidor
        // Al guardarlas en BD se convertirán automáticamente a UTC
        const startUTC = startLocal;
        const endUTC = endLocal;

        console.log('🌍 Rango UTC para búsqueda:', {
            inicio: startUTC.toISOString(),
            fin: endUTC.toISOString(),
        });

        return { startUTC, endUTC };
    }

    /**
     * ✅ CORREGIDO: Convertir fecha local a UTC correctamente
     * Aplica la misma lógica que caja-chica.service.ts
     *
     * @param fecha - Fecha en formato YYYY-MM-DD
     * @returns Rango UTC para búsqueda en BD
     */
    private getLocalDayRangeToUTC(fecha: string, timezone: string = 'America/Mexico_City') {
        // Parsear fecha como LOCAL (sin zona horaria)
        const base = fecha ? new Date(fecha) : new Date();

        const startLocal = new Date(base);
        startLocal.setHours(0, 0, 0, 0);

        const endLocal = new Date(base);
        endLocal.setHours(23, 59, 59, 999);

        // ✅ CORRECCIÓN: Restar el offset para convertir correctamente a UTC
        // getTimezoneOffset() devuelve la diferencia en MINUTOS entre UTC y hora local
        // Por ejemplo, en México (UTC-6) devuelve 360 minutos
        const startUTC = new Date(startLocal.getTime() - startLocal.getTimezoneOffset() * 60000);
        const endUTC = new Date(endLocal.getTime() - endLocal.getTimezoneOffset() * 60000);

        console.log('📅 Fecha local interpretada:', {
            inicio: startLocal.toString(),
            fin: endLocal.toString(),
        });

        console.log('🌍 Rango UTC para búsqueda:', {
            inicio: startUTC.toISOString(),
            fin: endUTC.toISOString(),
        });

        return { startUTC, endUTC };
    }

    // ═══════════════════════════════════════════════════════════════
    // 🔐 CÓDIGO DE AUTORIZACIÓN PARA CANCELACIONES
    // ═══════════════════════════════════════════════════════════════
    /**
     * Genera un código de autorización temporal para cancelar un cuadre
     *
     * @param cajaGeneralID - ID del cuadre a cancelar
     * @returns Código de autorización
     */
    async generarCodigoAutorizacion(
        cajaGeneralID: number,
    ): Promise<{ id: number; codigo: string }> {
        // Verificar que el cuadre existe
        const cuadre = await this.cajaGeneralRepo.findOne({
            where: { CajaGeneralID: cajaGeneralID },
        });

        if (!cuadre) {
            throw new HttpException(
                'Cuadre de caja general no encontrado',
                HttpStatus.NOT_FOUND,
            );
        }

        const codigo = Math.random().toString(36).substring(2, 8).toUpperCase();
        this.authorizationCodes.set(cajaGeneralID, codigo);

        return { id: cajaGeneralID, codigo };
    }

    /**
     * Valida el código de autorización
     */
    private validarCodigoAutorizacion(id: number, codigo: string): void {
        const codigoGuardado = this.authorizationCodes.get(id);
        if (!codigoGuardado || codigoGuardado !== codigo) {
            throw new HttpException(
                'Código de autorización inválido o expirado',
                HttpStatus.UNAUTHORIZED,
            );
        }
        this.authorizationCodes.delete(id);
    }

    // ═══════════════════════════════════════════════════════════════
    // 🛑 CANCELACIÓN DE CUADRE DE CAJA GENERAL
    // ═══════════════════════════════════════════════════════════════
    /**
     * Cancela un cuadre de caja general con validaciones de integridad
     *
     * REGLAS DE NEGOCIO:
     * 1. Caja General es el nivel más alto de la jerarquía, por lo que
     *    NO tiene restricciones de dependencia hacia arriba
     * 2. Al cancelar, se actualizan los estados de cajas chicas relacionadas
     * 3. Los cortes de usuario NO se desvinculan (mantienen su relación
     *    con la caja chica)
     *
     * @param cajaGeneralID - ID del cuadre a cancelar
     * @param usuarioCancela - Usuario que realiza la cancelación
     * @param codigo - Código de autorización
     * @param motivo - Motivo de la cancelación
     * @returns Mensaje de confirmación con estadísticas
     */
    async cancelarCuadre(
        cajaGeneralID: number,
        usuarioCancela: string,
        codigo: string,
        motivo: string,
    ): Promise<{
        message: string;
        cuadre: {
            CajaGeneralID: number;
            Fecha: Date;
            Estatus: string;
        };
        cajasChicasAfectadas: number;
        cortesRelacionados: number;
    }> {
        if (!usuarioCancela) {
            throw new HttpException(
                'El usuario de cancelación es obligatorio',
                HttpStatus.BAD_REQUEST,
            );
        }

        if (!motivo || motivo.trim().length === 0) {
            throw new HttpException(
                'El motivo de cancelación es obligatorio',
                HttpStatus.BAD_REQUEST,
            );
        }

        // Validar código de autorización
        this.validarCodigoAutorizacion(cajaGeneralID, codigo);

        console.log('🔍 ===== CANCELANDO CUADRE DE CAJA GENERAL =====');
        console.log(`   Caja General ID: ${cajaGeneralID}`);
        console.log(`   Usuario: ${usuarioCancela}`);

        // 1️⃣ Buscar el cuadre de caja general
        const cuadreGeneral = await this.cajaGeneralRepo.findOne({
            where: { CajaGeneralID: cajaGeneralID },
            relations: ['Sucursal', 'UsuarioCuadre'],
        });

        if (!cuadreGeneral) {
            throw new HttpException(
                'Cuadre de caja general no encontrado',
                HttpStatus.NOT_FOUND,
            );
        }

        console.log(`   Fecha cuadre: ${cuadreGeneral.Fecha.toISOString()}`);
        console.log(`   Sucursal: ${cuadreGeneral.Sucursal?.NombreSucursal || 'N/A'}`);
        console.log(`   Estatus actual: ${cuadreGeneral.Estatus}`);

        // 2️⃣ Validar que no esté ya cancelado
        if (cuadreGeneral.Estatus === 'Cancelado') {
            throw new HttpException(
                'El cuadre ya está cancelado',
                HttpStatus.BAD_REQUEST,
            );
        }

        // 3️⃣ Obtener rango de fechas para buscar registros relacionados
        const fechaInicio = new Date(cuadreGeneral.Fecha);
        fechaInicio.setHours(0, 0, 0, 0);
        const fechaFin = new Date(cuadreGeneral.Fecha);
        fechaFin.setHours(23, 59, 59, 999);

        // 4️⃣ Contar cajas chicas relacionadas (informativo)
        // NO las actualizamos porque el usuario puede querer mantenerlas cerradas
        // y solo reabrir la caja general
        const cajasChicasAfectadas = await this.cajaChicaRepo
            .createQueryBuilder('cc')
            .leftJoin('cc.Sucursal', 'sucursal')
            .where('cc.Fecha BETWEEN :fechaInicio AND :fechaFin', { fechaInicio, fechaFin })
            .andWhere('cc.Estatus = :estatus', { estatus: 'Cerrado' })
            .andWhere(cuadreGeneral.Sucursal?.SucursalID
                ? 'sucursal.SucursalID = :sucursalId'
                : '1=1',
                { sucursalId: cuadreGeneral.Sucursal?.SucursalID }
            )
            .getCount();

        console.log(`   ℹ️  ${cajasChicasAfectadas} caja(s) chica(s) cerrada(s) del mismo día`);

        // 5️⃣ Contar cortes relacionados (informativo)
        const cortesRelacionados = await this.cortesUsuariosRepo
            .createQueryBuilder('corte')
            .leftJoin('corte.Sucursal', 'sucursal')
            .where('corte.FechaCorte BETWEEN :fechaInicio AND :fechaFin', { fechaInicio, fechaFin })
            .andWhere('corte.Estatus = :estatus', { estatus: 'Cerrado' })
            .andWhere(cuadreGeneral.Sucursal?.SucursalID
                ? 'sucursal.SucursalID = :sucursalId'
                : '1=1',
                { sucursalId: cuadreGeneral.Sucursal?.SucursalID }
            )
            .getCount();

        console.log(`   ℹ️  ${cortesRelacionados} corte(s) de usuario relacionado(s)`);

        // 6️⃣ Cambiar estado a 'Cancelado'
        const observacionOriginal = cuadreGeneral.Observaciones || '';
        cuadreGeneral.Estatus = 'Cancelado';
        cuadreGeneral.Observaciones = `[CANCELADO] ${motivo} - Por: ${usuarioCancela} - ${new Date().toISOString()}` +
            (observacionOriginal ? `\n[Observación original]: ${observacionOriginal}` : '');

        await this.cajaGeneralRepo.save(cuadreGeneral);

        console.log('   ✅ CUADRE DE CAJA GENERAL CANCELADO EXITOSAMENTE');
        console.log('========================================================');

        return {
            message: '✅ Cuadre de caja general cancelado correctamente. ' +
                'Nota: Las cajas chicas y cortes de usuario mantienen su estado actual.',
            cuadre: {
                CajaGeneralID: cuadreGeneral.CajaGeneralID,
                Fecha: cuadreGeneral.Fecha,
                Estatus: cuadreGeneral.Estatus,
            },
            cajasChicasAfectadas,
            cortesRelacionados,
        };
    }

}
