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
            // 💵 SOLO EFECTIVO: El monto de entrega de caja chica debe ser solo efectivo físico
            // Tarjeta y transferencia están en el banco, no en caja física
            const montoEntrega = Number(cc.TotalEfectivo || 0);

            const mov: MovimientoTimelineDto = {
                hora: cc.FechaCierre
                    ? cc.FechaCierre.toTimeString().substring(0, 5)
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
                hora: pago.FechaPago
                    ? pago.FechaPago.toTimeString().substring(0, 5)
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

        // 2.3 Transacciones ingreso general
        const transIngresos = await this.transaccionesRepo
            .createQueryBuilder('t')
            .leftJoinAndSelect('t.CuentaBancaria', 'cuenta')
            .where("DATE(CONVERT_TZ(t.FechaTransaccion, '+00:00', :timezone)) = :fecha", { fecha, timezone })
            .andWhere('t.TipoTransaccion = :tipo', { tipo: 'Ingreso' })
            .andWhere('t.EsGeneral = :esGeneral', { esGeneral: true })
            .orderBy('t.FechaTransaccion', 'ASC')
            .getMany();

        console.log('📊 Transacciones ingreso encontradas:', transIngresos.length);

        transIngresos.forEach((t) => {
            const mov: MovimientoTimelineDto = {
                hora: t.FechaTransaccion.toTimeString().substring(0, 5),
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

        const totalEntradas =
            entradasCortesCajaChica.reduce((acc, mov) => acc + mov.monto, 0) +
            entradasTransaccionesIngreso.reduce((acc, mov) => acc + mov.monto, 0);

        // 3) EGRESOS
        const egresosTimeline: MovimientoTimelineDto[] = [];
        const egresosTransacciones: MovimientoTimelineDto[] = [];

        const transEgresos = await this.transaccionesRepo
            .createQueryBuilder('t')
            .leftJoinAndSelect('t.CuentaBancaria', 'cuenta')
            .where("DATE(CONVERT_TZ(t.FechaTransaccion, '+00:00', :timezone)) = :fecha", { fecha, timezone })
            .andWhere('t.TipoTransaccion = :tipo', { tipo: 'Egreso' })
            .andWhere('t.EsGeneral = :esGeneral', { esGeneral: true })
            .orderBy('t.FechaTransaccion', 'ASC')
            .getMany();

        console.log('📊 Transacciones egreso encontradas:', transEgresos.length);

        transEgresos.forEach((t) => {
            const mov: MovimientoTimelineDto = {
                hora: t.FechaTransaccion.toTimeString().substring(0, 5),
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

        const totalEgresos = egresosTimeline.reduce(
            (acc, mov) => acc + mov.monto,
            0,
        );

        const saldoCalculado = saldoInicial + totalEntradas - totalEgresos;
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

        const cortesUsuarios = cortesUsuariosRaw.map((c) => ({
            usuario: c.usuarioID?.NombreUsuario || '',
            usuarioId: c.usuarioID?.UsuarioID || null,
            sucursalId: c.Sucursal?.SucursalID ?? null,
            nombreSucursal: c.Sucursal?.NombreSucursal ?? null,
            fechaHoraCorte: c.FechaCorte,
            montoCorte: Number(c.TotalIngresos || 0),
            estadoCajaChica: c.Estatus,
            estadoCajaGeneral: cuadreDelDia ? 'Aplicado' : 'Pendiente',
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

        const iniciosUsuarios = inicios.map((i) => ({
            usuario: i.Usuario?.NombreUsuario || '',
            usuarioId: i.Usuario?.UsuarioID || null,
            sucursalId: i.Sucursal?.SucursalID ?? null,
            nombreSucursal: i.Sucursal?.NombreSucursal ?? null,
            fechaInicio: i.FechaInicio,
            montoInicio: Number(i.MontoInicial || 0),
            estado: i.Estatus,
        }));

        const preCuadre = {
            saldoInicial,
            totalEntradas,
            totalEgresos,
            saldoCalculado,
            diferencia,
        };

        // 8) Historial cuadres
        const historialRegistros = await this.cajaGeneralRepo.find({
            relations: ['Sucursal', 'UsuarioCuadre'],
            order: { Fecha: 'DESC' },
            take: 50,
        });

        const historialCuadres: HistorialCuadreCajaGeneralDto[] =
            historialRegistros.map((cg) => ({
                cajaGeneralId: cg.CajaGeneralID,
                fecha: cg.Fecha,
                sucursalId: cg.Sucursal?.SucursalID || null,
                nombreSucursal: cg.Sucursal?.NombreSucursal || null,
                saldoInicial: Number(cg.SaldoAnterior || 0),
                totalEntradas: Number(cg.TotalIngresos || 0),
                totalEgresos: Number(cg.TotalEgresos || 0),
                saldoFinal: Number(cg.SaldoFinal || 0),
                usuarioCuadre: cg.UsuarioCuadre?.NombreUsuario || null,
                estatus: cg.Estatus,
            }));

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
     * @returns Lista de usuarios con movimientos sin corte (agrupados por sucursal)
     */
    private async getUsuariosConMovimientosSinCorteGlobal(fecha: string) {
        console.log('🌍 Validando usuarios con movimientos sin corte GLOBAL');
        console.log(`   Fecha: ${fecha}`);

        // 1️⃣ Obtener rango de fechas del día
        const { startUTC, endUTC } = await this.getLocalDayRangeToUTCWithTimezone(fecha);

        console.log(`   Ventana: ${startUTC.toISOString()} → ${endUTC.toISOString()}`);

        // 2️⃣ Buscar TODOS los usuarios con TRANSACCIONES en el día
        const transacciones = await this.transaccionesRepo
            .createQueryBuilder('t')
            .leftJoin('t.UsuarioCreo', 'u')
            .leftJoin('u.Sucursal', 's')
            .where('t.FechaTransaccion BETWEEN :startUTC AND :endUTC', { startUTC, endUTC })
            .select('DISTINCT u.UsuarioID', 'UsuarioID')
            .addSelect('u.NombreUsuario', 'NombreUsuario')
            .addSelect('s.SucursalID', 'SucursalID')
            .addSelect('s.NombreSucursal', 'NombreSucursal')
            .getRawMany();

        console.log(`   📝 ${transacciones.length} usuarios con transacciones`);

        // 3️⃣ Buscar TODOS los usuarios con PAGOS DE PÓLIZA en el día
        const pagosPoliza = await this.pagosPolizaRepo
            .createQueryBuilder('p')
            .leftJoin('p.Usuario', 'u')
            .leftJoin('u.Sucursal', 's')
            .where('p.FechaPago BETWEEN :startUTC AND :endUTC', { startUTC, endUTC })
            .andWhere('p.MotivoCancelacion IS NULL')
            .select('DISTINCT u.UsuarioID', 'UsuarioID')
            .addSelect('u.NombreUsuario', 'NombreUsuario')
            .addSelect('s.SucursalID', 'SucursalID')
            .addSelect('s.NombreSucursal', 'NombreSucursal')
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

        // 🔍 VALIDACIÓN CRÍTICA FASE 1: Usuarios con movimientos sin corte CERRADO
        console.log('🔍 ===== VALIDANDO PREREQUISITOS PARA CUADRE DE CAJA GENERAL =====');
        const usuariosSinCorte = await this.getUsuariosConMovimientosSinCorteGlobal(fecha);

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
        const diferencia = efectivoCapturado - saldoCalculado;

        // ✅ VALIDACIÓN: Diferencia requiere observaciones
        if (Math.abs(diferencia) > 0.01) { // Tolerancia de 1 centavo por redondeo
            // 🔴 CUALQUIER diferencia requiere observaciones
            if (!observaciones || observaciones.trim().length === 0) {
                throw new HttpException(
                    `❌ Se requiere una observación cuando existe diferencia entre efectivo esperado y real. ` +
                    `Efectivo esperado: $${saldoCalculado.toFixed(2)}, ` +
                    `Efectivo capturado: $${efectivoCapturado.toFixed(2)}, ` +
                    `Diferencia: $${diferencia.toFixed(2)}`,
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
        if (
            (typeof totalEfectivoCapturado === 'number' && totalEfectivoCapturado < 0) ||
            (typeof totalTarjetaCapturado === 'number' && totalTarjetaCapturado < 0) ||
            (typeof totalTransferenciaCapturado === 'number' && totalTransferenciaCapturado < 0)
        ) {
            throw new HttpException(
                '❌ Los montos capturados no pueden ser negativos',
                HttpStatus.BAD_REQUEST,
            );
        }

        // ✅ VALIDACIÓN: SaldoReal debe coincidir con suma de capturados (si se proporcionan)
        if (
            typeof totalEfectivoCapturado === 'number' ||
            typeof totalTarjetaCapturado === 'number' ||
            typeof totalTransferenciaCapturado === 'number'
        ) {
            const sumaCapturados =
                (totalEfectivoCapturado ?? 0) +
                (totalTarjetaCapturado ?? 0) +
                (totalTransferenciaCapturado ?? 0);

            const diferenciaCaptura = Math.abs(saldoRealUsado - sumaCapturados);

            if (diferenciaCaptura > 0.01) {
                throw new HttpException(
                    `❌ Inconsistencia: El saldo real ($${saldoRealUsado.toFixed(2)}) no coincide ` +
                    `con la suma de montos capturados ($${sumaCapturados.toFixed(2)}). ` +
                    `Diferencia: $${diferenciaCaptura.toFixed(2)}`,
                    HttpStatus.BAD_REQUEST,
                );
            }
        }

        const totalDesdeCajaChica =
            dashboard.entradasDetalle.cortesCajaChica.reduce(
                (acc, mov) => acc + mov.monto,
                0,
            );

        const cajaGeneral = new CajaGeneral();

        // Guarda la fecha del cuadre como el fin del día local en UTC
        cajaGeneral.Fecha = endUTC;
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
     * @deprecated Use getLocalDayRangeToUTCWithTimezone() instead
     * Mantener por compatibilidad con código existente
     */
    private getLocalDayRangeToUTC(fecha: string, timezone: string = 'America/Mexico_City') {
        // Parsear fecha como LOCAL (sin zona horaria)
        const [year, month, day] = fecha.split('-').map(Number);

        // Crear fecha en hora local (ignorando UTC)
        const startLocal = new Date(year, month - 1, day, 0, 0, 0, 0);
        const endLocal = new Date(year, month - 1, day, 23, 59, 59, 999);

        console.log('📅 Fecha local interpretada:', {
            inicio: startLocal.toString(), // Thu Nov 20 2025 00:00:00 GMT-0600
            fin: endLocal.toString(),       // Thu Nov 20 2025 23:59:59 GMT-0600
        });

        // Estas fechas YA están en hora local del servidor
        // Al guardarlas en BD se convertirán automáticamente a UTC
        const startUTC = startLocal;
        const endUTC = endLocal;

        console.log('🌍 Rango UTC para búsqueda:', {
            inicio: startUTC.toISOString(), // 2025-11-20T06:00:00.000Z (en México UTC-6)
            fin: endUTC.toISOString(),       // 2025-11-21T05:59:59.999Z (en México UTC-6)
        });

        return { startUTC, endUTC };
    }



}
