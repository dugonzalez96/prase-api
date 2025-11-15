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

    private getDayRange(fecha: string) {
        if (!fecha) {
            throw new HttpException(
                'La fecha es obligatoria',
                HttpStatus.BAD_REQUEST,
            );
        }
        const start = new Date(`${fecha}T00:00:00`);
        const end = new Date(`${fecha}T23:59:59`);
        return { start, end };
    }

    private parseDateOrToday(fecha?: string): { start: Date; end: Date } {
        if (!fecha) {
            const hoy = new Date();
            const yyyy = hoy.getFullYear();
            const mm = String(hoy.getMonth() + 1).padStart(2, '0');
            const dd = String(hoy.getDate()).padStart(2, '0');
            fecha = `${yyyy}-${mm}-${dd}`;
        }
        const start = new Date(`${fecha}T00:00:00`);
        const end = new Date(`${fecha}T23:59:59`);
        return { start, end };
    }

    // DASHBOARD COMPLETO (incluye pre-cuadre)
    async getDashboard(
        dto: GetCajaGeneralDashboardDto,
    ): Promise<CajaGeneralDashboardResponseDto> {
        const { fecha, sucursalId } = dto;
        const { start, end } = this.getDayRange(fecha);

        // 1) Saldo inicial: último cuadre CERRADO antes de la fecha (con o sin sucursal)
        const ultimoCuadre = await this.cajaGeneralRepo.findOne({
            where: {
                Fecha: LessThanOrEqual(start),
                Estatus: 'Cerrado',
                ...(sucursalId ? { Sucursal: { SucursalID: sucursalId } } : {}),
            },
            relations: ['Sucursal', 'UsuarioCuadre'],
            order: { Fecha: 'DESC' },
        });

        const saldoInicial = ultimoCuadre?.SaldoFinal || 0;

        // 2) ENTRADAS DEL DÍA
        //   🔹 Se componen de:
        //   - Cajas chicas cerradas (lo que realmente se entrega a caja general)
        //   - Transacciones de ingreso directas a caja general (InicioCaja IS NULL)
        //   - Pagos de póliza directos (por ahora solo informativos en detalle)

        const entradasTimeline: MovimientoTimelineDto[] = [];
        const entradasCortesCajaChica: MovimientoTimelineDto[] = [];
        const entradasPagosPoliza: MovimientoTimelineDto[] = [];
        const entradasTransaccionesIngreso: MovimientoTimelineDto[] = [];

        // 2.1. Cajas chicas cerradas (por sucursal / día)
        const cajasChica = await this.cajaChicaRepo.find({
            where: {
                FechaCierre: Between(start, end),
                Estatus: 'Cerrado',
                ...(sucursalId ? { Sucursal: { SucursalID: sucursalId } } : {}),
            },
            relations: ['Sucursal', 'UsuarioCuadre'],
            order: { FechaCierre: 'ASC' },
        });

        cajasChica.forEach((cc) => {
            const montoEntrega = Number(
                cc.SaldoReal ??
                cc.SaldoEsperado ??
                (Number(cc.TotalEfectivo || 0) +
                    Number(cc.TotalPagoConTarjeta || 0) +
                    Number(cc.TotalTransferencia || 0)),
            );

            const mov: MovimientoTimelineDto = {
                hora: cc.FechaCierre
                    ? cc.FechaCierre.toTimeString().substring(0, 5)
                    : '00:00',
                tipo: 'CORTE_CAJA_CHICA',
                sucursalId: cc.Sucursal?.SucursalID ?? null,
                nombreSucursal: cc.Sucursal?.NombreSucursal ?? null,
                referencia: cc.FolioCierre || `CajaChicaID ${cc.CajaChicaID}`,
                descripcion: `Corte caja chica ${cc.Sucursal?.NombreSucursal || ''
                    }`,
                monto: montoEntrega,
            };

            entradasTimeline.push(mov);
            entradasCortesCajaChica.push(mov);
        });

        // 2.2. Pagos de póliza (informativos; si quieres incluirlos en totalEntradas, se suma su monto)
        const pagos = await this.pagosPolizaRepo.find({
            where: {
                FechaPago: Between(start, end),
                // FUTURO: cuando tengas sucursal ligada, filtrarla aquí
            },
            relations: ['Usuario'],
            order: { FechaPago: 'ASC' },
        });

        pagos.forEach((pago) => {
            const mov: MovimientoTimelineDto = {
                hora: pago.FechaPago
                    ? pago.FechaPago.toTimeString().substring(0, 5)
                    : '00:00',
                tipo: 'PAGO_POLIZA',
                sucursalId: null, // cuando ligues sucursal, la llenas
                nombreSucursal: null,
                referencia: `Pago póliza ${pago.PolizaID || ''}`,
                descripcion: pago.ReferenciaPago || '',
                monto: Number(pago.MontoPagado || 0),
            };

            // Por ahora SOLO entra al detalle, no a totalEntradas,
            // para evitar doble conteo con caja chica.
            entradasPagosPoliza.push(mov);
        });

        // 2.3. Transacciones de ingreso DIRECTAS a caja general (InicioCaja IS NULL)
        const transIngresos = await this.transaccionesRepo.find({
            where: {
                FechaTransaccion: Between(start, end),
                TipoTransaccion: 'Ingreso',
                EsGeneral: true,
            },
            relations: ['CuentaBancaria'],
            order: { FechaTransaccion: 'ASC' },
        });

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

        // totalEntradas SOLO suma lo que realmente entra a caja general:
        //  - cortes de caja chica
        //  - transacciones de ingreso directas a general
        // (pagos de póliza de momento no se suman para evitar doble conteo)
        const totalEntradas =
            entradasCortesCajaChica.reduce((acc, mov) => acc + mov.monto, 0) +
            entradasTransaccionesIngreso.reduce((acc, mov) => acc + mov.monto, 0);

        // 3) EGRESOS DEL DÍA
        const egresosTimeline: MovimientoTimelineDto[] = [];
        const egresosTransacciones: MovimientoTimelineDto[] = [];

        const transEgresos = await this.transaccionesRepo.find({
            where: {
                FechaTransaccion: Between(start, end),
                TipoTransaccion: 'Egreso',
                EsGeneral: true,
            },
            relations: ['CuentaBancaria'],
            order: { FechaTransaccion: 'ASC' },
        });

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

        // 4) RESUMEN Y PRE-CUADRE
        const saldoCalculado = saldoInicial + totalEntradas - totalEgresos;
        const diferencia = 0; // la calcula el front

        let estadoCuadre: 'PRE_CUADRE' | 'CUADRADO' | 'CON_DIFERENCIA' =
            'PRE_CUADRE';

        const cuadreDelDia = await this.cajaGeneralRepo.findOne({
            where: {
                Fecha: Between(start, end),
                Estatus: 'Cerrado',
                ...(sucursalId ? { Sucursal: { SucursalID: sucursalId } } : {}),
            },
        });

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

        // 5) LISTADO DE CORTES DE USUARIO (solo auditoría)
        const cortesUsuariosRaw = await this.cortesUsuariosRepo.find({
            where: {
                FechaCorte: Between(start, end),
                ...(sucursalId ? { Sucursal: { SucursalID: sucursalId } } : {}),
            },
            relations: ['Sucursal', 'usuarioID'],
            order: { FechaCorte: 'DESC' },
        });

        const cortesUsuarios = cortesUsuariosRaw.map((c) => ({
            usuario: c.usuarioID?.NombreUsuario || '',
            usuarioId: c.usuarioID?.UsuarioID || null,
            sucursalId: c.Sucursal?.SucursalID ?? null,
            nombreSucursal: c.Sucursal?.NombreSucursal ?? null,
            fechaHoraCorte: c.FechaCorte,
            // Para auditoría puedes mostrar TotalIngresos,
            // pero ya NO se usa para sumar entradas en caja general.
            montoCorte: Number(c.TotalIngresos || 0),
            estadoCajaChica: c.Estatus,
            estadoCajaGeneral: cuadreDelDia ? 'Aplicado' : 'Pendiente',
        }));

        // 6) INICIOS DE USUARIO (auditoría)
        const inicios = await this.iniciosCajaRepo.find({
            where: {
                FechaInicio: Between(start, end),
                ...(sucursalId ? { Sucursal: { SucursalID: sucursalId } } : {}),
            },
            relations: ['Sucursal', 'Usuario'],
            order: { FechaInicio: 'ASC' },
        });

        const iniciosUsuarios = inicios.map((i) => ({
            usuario: i.Usuario?.NombreUsuario || '',
            usuarioId: i.Usuario?.UsuarioID || null,
            sucursalId: i.Sucursal?.SucursalID ?? null,
            nombreSucursal: i.Sucursal?.NombreSucursal ?? null,
            fechaInicio: i.FechaInicio,
            montoInicio: Number(i.MontoInicial || 0),
            estado: i.Estatus,
        }));

        // 7) PRE-CUADRE PARA PANEL
        const preCuadre = {
            saldoInicial,
            totalEntradas,
            totalEgresos,
            saldoCalculado,
            diferencia,
        };

        // 8) HISTORIAL DE CUADRES
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

    // SERVICIO SEPARADO PARA PRE-CUADRE (lo que enseñas en el panel previo al cierre)
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
    }> {
        const dashboard = await this.getDashboard(dto);

        return {
            filtros: dashboard.filtros,
            preCuadre: dashboard.preCuadre,
            entradasDetalle: dashboard.entradasDetalle,
            egresosDetalle: dashboard.egresosDetalle,
        };
    }

    // CUADRAR CAJA GENERAL
    async cuadrarCajaGeneral(dto: CuadrarCajaGeneralDto): Promise<CajaGeneral> {
        const {
            fecha,
            sucursalId,
            usuarioCuadreId,
            observaciones,
            folioCierre,
            saldoReal, // lo manda el front
            totalEfectivoCapturado,
            totalTarjetaCapturado,
            totalTransferenciaCapturado,
        } = dto;

        const { end } = this.getDayRange(fecha);

        // Foto oficial del sistema al momento de cuadrar
        const dashboard = await this.getDashboard({ fecha, sucursalId });

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

        const saldoCalculado = dashboard.preCuadre.saldoCalculado;
        const saldoRealUsado =
            typeof saldoReal === 'number' ? saldoReal : saldoCalculado;
        const diferencia = saldoRealUsado - saldoCalculado;

        // Total que proviene específicamente de cortes de caja chica
        const totalDesdeCajaChica =
            dashboard.entradasDetalle.cortesCajaChica.reduce(
                (acc, mov) => acc + mov.monto,
                0,
            );

        const cajaGeneral = new CajaGeneral();
        cajaGeneral.Fecha = end;
        cajaGeneral.Sucursal = sucursal || null;
        cajaGeneral.SaldoAnterior = dashboard.resumen.saldoInicial;
        cajaGeneral.IngresosCajaChica = totalDesdeCajaChica;
        cajaGeneral.TotalIngresos = dashboard.preCuadre.totalEntradas;
        cajaGeneral.TotalEgresos = dashboard.preCuadre.totalEgresos;

        // Si luego quieres mapear teórico por medios, lo hacemos; por ahora 0
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
        const { start, end } = this.parseDateOrToday(fecha);

        const where: any = {
            EsGeneral: true,
            FechaTransaccion: Between(start, end),
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


}
