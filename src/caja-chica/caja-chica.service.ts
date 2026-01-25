// src/caja-chica/caja-chica.service.ts
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In, FindOptionsWhere, LessThanOrEqual } from 'typeorm';

import { CajaChica } from './entities/caja-chica.entity';
import { usuarios } from 'src/users/users.entity';
import { CreateCajaChicaDto } from './dto/create-caja-chica.dto';
import { CortesUsuarios } from 'src/corte-caja/entities/cortes-usuarios.entity';
import { BitacoraEdiciones } from 'src/bitacora-ediciones/bitacora-ediciones.entity';
import { BitacoraEliminaciones } from 'src/bitacora-eliminaciones/bitacora-eliminaciones.entity';
import { IniciosCaja } from 'src/inicios-caja/entities/inicios-caja.entity';
import { Sucursal } from 'src/sucursales/entities/sucursales.entity';
import { Transacciones } from 'src/transacciones/entities/transacciones.entity';
import { PagosPoliza } from 'src/pagos-poliza/entities/pagos-poliza.entity';
import { CajaGeneral } from 'src/caja-general/entities/caja-general.entity';

type EstatusCajaChica = 'Pendiente' | 'Cerrado' | 'Cancelado';

@Injectable()
export class CajaChicaService {
    private authorizationCodes: Map<number, string> = new Map();

    constructor(
        @InjectRepository(CajaChica, 'db1')
        private readonly cajaChicaRepository: Repository<CajaChica>,

        @InjectRepository(CortesUsuarios, 'db1')
        private readonly cortesUsuariosRepository: Repository<CortesUsuarios>,

        @InjectRepository(usuarios, 'db1')
        private readonly usuariosRepository: Repository<usuarios>,

        @InjectRepository(IniciosCaja, 'db1')
        private readonly iniciosCajaRepository: Repository<IniciosCaja>,

        @InjectRepository(BitacoraEdiciones, 'db1')
        private readonly bitacoraEdicionesRepository: Repository<BitacoraEdiciones>,

        @InjectRepository(Sucursal, 'db1')
        private readonly sucursalRepository: Repository<Sucursal>,

        @InjectRepository(BitacoraEliminaciones, 'db1')
        private readonly bitacoraEliminacionesRepository: Repository<BitacoraEliminaciones>,

        @InjectRepository(Transacciones, 'db1')
        private readonly transaccionesRepository: Repository<Transacciones>,

        @InjectRepository(PagosPoliza, 'db1')
        private readonly pagosPolizaRepository: Repository<PagosPoliza>,

        @InjectRepository(CajaGeneral, 'db1')
        private readonly cajaGeneralRepository: Repository<CajaGeneral>,
    ) { }

    // ============================================================
    // 🔐 Código de autorización temporal (para cancelar)
    // ============================================================
    async generarCodigoAutorizacion(id: number): Promise<{ id: number; codigo: string }> {
        const codigo = Math.random().toString(36).substring(2, 8).toUpperCase();
        this.authorizationCodes.set(id, codigo);
        return { id, codigo };
    }

    private validarCodigoAutorizacion(id: number, codigo: string): void {
        const codigoGuardado = this.authorizationCodes.get(id);
        if (!codigoGuardado || codigoGuardado !== codigo) {
            throw new HttpException('Código de autorización inválido o expirado', HttpStatus.UNAUTHORIZED);
        }
        this.authorizationCodes.delete(id);
    }


    private rangoDiaActual() {
        const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
        const finDia = new Date(); finDia.setHours(23, 59, 59, 999);
        return { hoy, finDia };
    }

    /** Ventana de trabajo: desde el último cuadre CERRADO hasta fin de hoy */
    /** Ventana de trabajo: desde el último cuadre CERRADO de la sucursal hasta fin de hoy */
    private async ventanaDesdeUltimoCuadre(sucursalId: number) {
        const { hoy, finDia } = this.rangoDiaActual();

        if (!sucursalId) {
            throw new HttpException(
                'SucursalID es obligatorio para precuadre de caja chica',
                HttpStatus.BAD_REQUEST,
            );
        }

        const ultimo = await this.cajaChicaRepository.findOne({
            where: {
                Estatus: 'Cerrado',
                Sucursal: { SucursalID: sucursalId },
            },
            relations: ['Sucursal'],
            order: { FechaCierre: 'DESC' },
        });

        // Si no hay cuadre previo en esa sucursal, arrastramos "desde el inicio de los tiempos"
        const desde = ultimo ? new Date(ultimo.FechaCierre) : new Date(0);

        return { desde, finDia, ultimoCuadre: ultimo };
    }


    /**
     * 🔍 VALIDACIÓN CRÍTICA: Usuarios con "movimientos" SIN corte CERRADO en la ventana
     *
     * REGLA DE NEGOCIO (FASE 1):
     * "La caja chica no se debe poder cuadrar, si existe algún usuario que haya
     * tenido movimientos durante el día y que no se le haya realizado el corte respectivo."
     *
     * MOVIMIENTOS = Transacciones + Pagos de Póliza
     *
     * @param desde - Fecha inicio de la ventana (desde último cuadre)
     * @param finDia - Fecha fin de la ventana (hoy)
     * @param sucursalId - ID de la sucursal
     * @returns Lista de usuarios con movimientos sin corte cerrado
     */
    private async getUsuariosConMovimientosSinCorte(
        desde: Date,
        finDia: Date,
        sucursalId: number,
    ) {
        if (!sucursalId) return [];

        console.log(`🔍 Validando usuarios con movimientos sin corte en sucursal ${sucursalId}`);
        console.log(`   Ventana: ${desde.toISOString()} → ${finDia.toISOString()}`);

        // 1️⃣ Buscar todos los usuarios de la sucursal
        const usuariosSucursal = await this.usuariosRepository.find({
            where: { SucursalID: sucursalId },
        });

        if (usuariosSucursal.length === 0) {
            console.log('   ℹ️ No hay usuarios en esta sucursal');
            return [];
        }

        const usuariosIds = usuariosSucursal.map((u) => u.UsuarioID);
        console.log(`   👥 ${usuariosIds.length} usuarios en la sucursal`);

        // 2️⃣ Buscar usuarios con TRANSACCIONES DE CAJA CHICA en la ventana
        // ✅ CORRECCIÓN: Solo contar transacciones de caja chica (EsGeneral = false)
        // Las transacciones de caja general NO requieren corte de usuario
        const transacciones = await this.transaccionesRepository
            .createQueryBuilder('t')
            .leftJoin('t.UsuarioCreo', 'u')
            .where('u.UsuarioID IN (:...usuariosIds)', { usuariosIds })
            .andWhere('t.FechaTransaccion BETWEEN :desde AND :finDia', { desde, finDia })
            .andWhere('(t.EsGeneral = :esGeneral OR t.EsGeneral IS NULL)', { esGeneral: false })
            .select('DISTINCT u.UsuarioID', 'UsuarioID')
            .getRawMany();

        const usuariosConTransacciones = new Set(
            transacciones.map((t) => t.UsuarioID),
        );

        console.log(`   📝 ${usuariosConTransacciones.size} usuarios con transacciones`);

        // 3️⃣ Buscar usuarios con PAGOS DE PÓLIZA en la ventana
        const pagosPoliza = await this.pagosPolizaRepository
            .createQueryBuilder('p')
            .leftJoin('p.Usuario', 'u')
            .where('u.UsuarioID IN (:...usuariosIds)', { usuariosIds })
            .andWhere('p.FechaPago BETWEEN :desde AND :finDia', { desde, finDia })
            .andWhere('p.MotivoCancelacion IS NULL')
            .select('DISTINCT u.UsuarioID', 'UsuarioID')
            .getRawMany();

        const usuariosConPagos = new Set(
            pagosPoliza.map((p) => p.UsuarioID),
        );

        console.log(`   💳 ${usuariosConPagos.size} usuarios con pagos de póliza`);

        // 4️⃣ UNION: Usuarios con movimientos (transacciones O pagos)
        const usuariosConMovimientos = new Set([
            ...usuariosConTransacciones,
            ...usuariosConPagos,
        ]);

        if (usuariosConMovimientos.size === 0) {
            console.log('   ✅ No hay usuarios con movimientos en la ventana');
            return [];
        }

        console.log(`   📊 TOTAL: ${usuariosConMovimientos.size} usuarios con movimientos`);

        // 5️⃣ Buscar usuarios con CORTES CERRADOS en la ventana
        const cortesCerrados = await this.cortesUsuariosRepository.find({
            where: {
                FechaCorte: Between(desde, finDia),
                Estatus: 'Cerrado',
                Sucursal: { SucursalID: sucursalId },
            },
            relations: ['usuarioID', 'Sucursal'],
        });

        const usuariosConCorteCerrado = new Set(
            cortesCerrados.map((c) => c.usuarioID?.UsuarioID),
        );

        console.log(`   ✅ ${usuariosConCorteCerrado.size} usuarios con corte CERRADO`);

        // 6️⃣ FILTRAR: Usuarios con movimientos pero SIN corte cerrado
        const usuariosSinCorte = Array.from(usuariosConMovimientos).filter(
            (uid) => !usuariosConCorteCerrado.has(uid),
        );

        if (usuariosSinCorte.length === 0) {
            console.log('   ✅ Todos los usuarios con movimientos tienen corte cerrado');
            return [];
        }

        console.log(`   ❌ ${usuariosSinCorte.length} usuarios con movimientos SIN corte cerrado`);

        // 7️⃣ Obtener detalles de usuarios problemáticos
        const detalle = await this.usuariosRepository.find({
            where: {
                UsuarioID: In(usuariosSinCorte),
                SucursalID: sucursalId,
            },
        });

        const resultado = detalle.map((u) => ({
            UsuarioID: u.UsuarioID,
            Nombre: u.NombreUsuario,
        }));

        console.log(`   🚨 Usuarios que bloquean el cuadre:`, resultado);

        return resultado;
    }



    // ============================================================
    // 🔹 GET /caja-chica/precuadre
    //  - Suma cortes de usuario CERRADOS del día
    //  - Prepara capturables en 0 para UI
    // ============================================================


    async precuadre(sucursalId: number) {
        if (!sucursalId) {
            throw new HttpException(
                'SucursalID es obligatorio para precuadre de caja chica',
                HttpStatus.BAD_REQUEST,
            );
        }

        const { desde, finDia, ultimoCuadre } =
            await this.ventanaDesdeUltimoCuadre(sucursalId);

        // Cortes CERRADOS en la ventana (desde último cierre hasta hoy) SOLO de la sucursal
        const cortesCerrados = await this.cortesUsuariosRepository.find({
            where: {
                FechaCorte: Between(desde, finDia),
                Estatus: 'Cerrado',
                Sucursal: { SucursalID: sucursalId },
            },
            relations: ['usuarioID', 'Sucursal'],
            order: { FechaCorte: 'DESC' },
        });

        // Cortes PENDIENTES en la misma ventana (alerta/bloqueo) SOLO de la sucursal
        const cortesPendientes = await this.cortesUsuariosRepository.find({
            where: {
                FechaCorte: Between(desde, finDia),
                Estatus: 'Pendiente',
                Sucursal: { SucursalID: sucursalId },
            },
            relations: ['usuarioID', 'Sucursal'],
        });

        // Fondo inicial vigente (suma de inicios activos/pendientes SOLO de la sucursal)
        const iniciosActivosRaw = await this.iniciosCajaRepository.find({
            where: { Estatus: In(['Activo', 'Pendiente']) },
            relations: ['Usuario', 'UsuarioAutorizo'],
            order: { FechaInicio: 'DESC' },
        });

        const iniciosActivos = iniciosActivosRaw.filter(
            (i) => i.Usuario?.SucursalID === sucursalId,
        );

        // ✅ PRECISIÓN MATEMÁTICA: Redondear todos los totales a 2 decimales
        const FondoInicial = Number(iniciosActivos.reduce(
            (s, i) => s + Number(i.MontoInicial ?? 0),
            0,
        ).toFixed(2));

        // Totales acumulados en la ventana SOLO de esa sucursal
        const Totales = {
            TotalIngresos: Number(cortesCerrados.reduce(
                (a, b) => a + Number(b.TotalIngresos ?? 0),
                0,
            ).toFixed(2)),
            TotalEgresos: Number(cortesCerrados.reduce(
                (a, b) => a + Number(b.TotalEgresos ?? 0),
                0,
            ).toFixed(2)),
            TotalEfectivo: Number(cortesCerrados.reduce(
                (a, b) => a + Number(b.TotalEfectivo ?? 0),
                0,
            ).toFixed(2)),
            TotalPagoConTarjeta: Number(cortesCerrados.reduce(
                (a, b) => a + Number(b.TotalPagoConTarjeta ?? 0),
                0,
            ).toFixed(2)),
            TotalTransferencia: Number(cortesCerrados.reduce(
                (a, b) => a + Number(b.TotalTransferencia ?? 0),
                0,
            ).toFixed(2)),
        };

        // 💵 SOLO EFECTIVO: El saldo esperado debe ser solo efectivo físico
        // TotalEfectivo ya incluye: FondoInicial + ingresosEfectivo - egresosEfectivo
        // Tarjeta y transferencia se muestran informativamente pero NO se incluyen en el saldo esperado
        const SaldoEsperado = Number(Totales.TotalEfectivo.toFixed(2));

        // Validación: usuarios con “movimientos” sin corte CERRADO, SOLO sucursal
        const usuariosMovSinCorte = await this.getUsuariosConMovimientosSinCorte(
            desde,
            finDia,
            sucursalId,
        );

        // Usuarios sin corte CERRADO (para tablero general, SOLO sucursal)
        const usuariosConCorteCerrado = new Set(
            cortesCerrados.map((c) => c.usuarioID?.UsuarioID),
        );

        const todosUsuarios = await this.usuariosRepository.find({
            where: { SucursalID: sucursalId },
        });

        const usuariosPendientesDeCorte = todosUsuarios.filter(
            (u) => !usuariosConCorteCerrado.has(u.UsuarioID),
        );

        // ========= MENSAJES =========
        const mensajes: string[] = [];

        if (ultimoCuadre) {
            mensajes.push(
                `Se acumula desde el último cuadre (cerrado el ${ultimoCuadre.FechaCierre.toISOString()}).`,
            );
        } else {
            mensajes.push(
                'No hay cuadre previo; se acumula todo el historial de la sucursal.',
            );
        }

        if (iniciosActivos.length === 0) {
            mensajes.push(
                'No hay Inicios de Caja activos/pendientes; FondoInicial=0.',
            );
        } else {
            mensajes.push(
                `Existen ${iniciosActivos.length} inicio(s) de caja activos/pendientes en esta sucursal (FondoInicial=${FondoInicial.toFixed(
                    2,
                )}).`,
            );
        }

        if (cortesPendientes.length > 0) {
            mensajes.push(
                `Hay ${cortesPendientes.length} corte(s) de usuario PENDIENTE en la ventana; no se debe cuadrar.`,
            );
        }

        if (usuariosMovSinCorte.length > 0) {
            mensajes.push(
                `Bloqueo: ${usuariosMovSinCorte.length} usuario(s) con movimientos sin corte CERRADO en esta sucursal.`,
            );
        }

        // 👇 NUEVO: mensaje explícito si no hay movimientos en la ventana
        const hayMovimientos =
            Totales.TotalIngresos !== 0 || Totales.TotalEgresos !== 0;

        if (!hayMovimientos) {
            mensajes.push(
                'No se detectan ingresos ni egresos en la ventana de cuadre para esta sucursal; no es necesario cuadrar hoy.',
            );
        }

        return {
            // Contexto (mismo formato que ya usas)
            FechaDesde: ultimoCuadre?.FechaCierre ?? null,
            FechaHasta: finDia,

            // Fondo y totales acumulados
            FondoInicial,
            Totales,
            SaldoEsperado,

            // Capturables iniciales (UI)
            SaldoReal: 0,
            TotalEfectivoCapturado: 0,
            TotalTarjetaCapturado: 0,
            TotalTransferenciaCapturado: 0,
            Diferencia: 0,

            // Inicios activos (auditoría)
            IniciosActivos: iniciosActivos.map((i) => ({
                InicioCajaID: i.InicioCajaID,
                UsuarioID: i.Usuario?.UsuarioID ?? null,
                Usuario: i.Usuario?.NombreUsuario ?? null,
                AutorizoID: i.UsuarioAutorizo?.UsuarioID ?? null,
                Autorizo: i.UsuarioAutorizo?.NombreUsuario ?? null,
                FechaInicio: i.FechaInicio,
                MontoInicial: Number(i.MontoInicial ?? 0),
                Estatus: i.Estatus,
            })),

            // Tablero / alertas
            CortesPendientes: cortesPendientes.length,
            UsuariosConMovimientosSinCorte: usuariosMovSinCorte,
            PendientesDeCorte: usuariosPendientesDeCorte.length,
            UsuariosPendientes: usuariosPendientesDeCorte.map((u) => ({
                UsuarioID: u.UsuarioID,
                Nombre: u.NombreUsuario,
            })),

            // Mensajes (incluye los que ya tenías + “no hay movimientos”)
            mensajes,

            CajaEnCeroSoloTrasCuadre: false,
            DebeCuadrarseHoy: hayMovimientos, // solo true si hay actividad real
        };
    }



    // ============================================================
    // 🔹 POST /caja-chica/cuadrar
    //  - Valida que no existan cortes de usuario PENDIENTE hoy
    //  - Valida que no exista ya un Cuadre (Cerrado|Pendiente) hoy
    //  - Calcula SaldoEsperado y guarda capturados + Folio + Cierre
    // ============================================================
    async cuadrarCajaChica(
        usuarioID: number,
        sucursalId: number,
        dto: CreateCajaChicaDto,
    ) {
        if (!sucursalId) {
            throw new HttpException(
                'SucursalID es obligatorio para cuadrar caja chica',
                HttpStatus.BAD_REQUEST,
            );
        }

        // ✅ VALIDACIÓN 1: Montos capturados no negativos
        const { SaldoReal, TotalEfectivoCapturado, TotalTarjetaCapturado, TotalTransferenciaCapturado } = dto;

        if (TotalEfectivoCapturado < 0) {
            throw new HttpException(
                '❌ El monto de efectivo capturado no puede ser negativo',
                HttpStatus.BAD_REQUEST,
            );
        }

        // 💵 VALIDACIÓN CORREGIDA: SaldoReal = SOLO EFECTIVO
        // El dinero físico que se entrega es SOLO el efectivo.
        // Tarjeta y transferencia son INFORMATIVOS (ya están en el banco).
        // Por lo tanto, SaldoReal debe coincidir SOLO con TotalEfectivoCapturado.
        const efectivoCapturado = Number(TotalEfectivoCapturado ?? 0);
        const saldoRealNumerico = Number(SaldoReal ?? 0);

        // Si se proporcionó SaldoReal, debe coincidir con el efectivo
        if (SaldoReal !== undefined && SaldoReal !== null) {
            const diferenciaCaptura = Math.abs(saldoRealNumerico - efectivoCapturado);

            if (diferenciaCaptura > 0.01) {
                throw new HttpException(
                    `❌ Inconsistencia: El saldo real ($${saldoRealNumerico.toFixed(2)}) debe coincidir ` +
                    `con el efectivo capturado ($${efectivoCapturado.toFixed(2)}). ` +
                    `Recuerde: Solo se entrega efectivo físico. Tarjeta y transferencia son informativos.`,
                    HttpStatus.BAD_REQUEST,
                );
            }
        }

        // ℹ️ Tarjeta y transferencia son solo informativos, no se validan contra el efectivo
        // pero deben ser >= 0 si se proporcionan
        if (TotalTarjetaCapturado !== undefined && TotalTarjetaCapturado < 0) {
            throw new HttpException(
                '❌ El monto de tarjeta capturado no puede ser negativo',
                HttpStatus.BAD_REQUEST,
            );
        }
        if (TotalTransferenciaCapturado !== undefined && TotalTransferenciaCapturado < 0) {
            throw new HttpException(
                '❌ El monto de transferencia capturado no puede ser negativo',
                HttpStatus.BAD_REQUEST,
            );
        }

        // ventana desde último cuadre DE ESA SUCURSAL
        const { desde, finDia } = await this.ventanaDesdeUltimoCuadre(sucursalId);

        // (A) BLOQUEO por cortes PENDIENTES en la ventana (solo sucursal)
        const hayPendientes = await this.cortesUsuariosRepository.count({
            where: {
                FechaCorte: Between(desde, finDia),
                Estatus: 'Pendiente',
                Sucursal: { SucursalID: sucursalId },
            },
        });

        if (hayPendientes > 0) {
            throw new HttpException(
                `❌ No se puede cuadrar: existen ${hayPendientes} corte(s) de usuario con estatus PENDIENTE en la sucursal ${sucursalId}.`,
                HttpStatus.BAD_REQUEST,
            );
        }

        // (B) BLOQUEO por "usuarios con movimientos" sin corte CERRADO (solo sucursal)
        const usuariosMovSinCorte = await this.getUsuariosConMovimientosSinCorte(
            desde,
            finDia,
            sucursalId,
        );

        if (usuariosMovSinCorte.length > 0) {
            const lista = usuariosMovSinCorte
                .map((u) => `${u.UsuarioID}-${u.Nombre}`)
                .join(', ');
            throw new HttpException(
                `❌ No se puede cuadrar: usuarios con movimientos sin corte CERRADO en la sucursal ${sucursalId}: ${lista}.`,
                HttpStatus.BAD_REQUEST,
            );
        }

        // (C) BLOQUEO si ya existiera cuadre (Cerrado|Pendiente) HOY en esa sucursal
        const { hoy, finDia: finHoy } = this.rangoDiaActual();
        const cuadreExistente = await this.cajaChicaRepository.findOne({
            where: {
                Fecha: Between(hoy, finHoy),
                Estatus: In(['Cerrado', 'Pendiente']),
                Sucursal: { SucursalID: sucursalId },
            },
            relations: ['Sucursal'],
        });

        if (cuadreExistente) {
            throw new HttpException(
                `❌ Ya existe un cuadre de caja chica con estatus '${cuadreExistente.Estatus}' para el día de hoy en la sucursal ${sucursalId}.`,
                HttpStatus.BAD_REQUEST,
            );
        }

        // Totales acumulados en ventana (SOLO cortes cerrados de esa sucursal)
        const cortesCerrados = await this.cortesUsuariosRepository.find({
            where: {
                FechaCorte: Between(desde, finDia),
                Estatus: 'Cerrado',
                Sucursal: { SucursalID: sucursalId },
            },
            relations: ['usuarioID'],
        });

        if (cortesCerrados.length === 0) {
            throw new HttpException(
                '❌ No hay cortes de usuario CERRADOS en la ventana para esta sucursal. No es posible realizar el cuadre.',
                HttpStatus.BAD_REQUEST,
            );
        }

        // ✅ PRECISIÓN MATEMÁTICA: Redondear todos los totales a 2 decimales
        const TotalIngresos = Number(cortesCerrados.reduce(
            (a, b) => a + Number(b.TotalIngresos ?? 0),
            0,
        ).toFixed(2));
        const TotalEgresos = Number(cortesCerrados.reduce(
            (a, b) => a + Number(b.TotalEgresos ?? 0),
            0,
        ).toFixed(2));
        const TotalEfectivo = Number(cortesCerrados.reduce(
            (a, b) => a + Number(b.TotalEfectivo ?? 0),
            0,
        ).toFixed(2));
        const TotalPagoConTarjeta = Number(cortesCerrados.reduce(
            (a, b) => a + Number(b.TotalPagoConTarjeta ?? 0),
            0,
        ).toFixed(2));
        const TotalTransferencia = Number(cortesCerrados.reduce(
            (a, b) => a + Number(b.TotalTransferencia ?? 0),
            0,
        ).toFixed(2));

        // FondoInicial vigente SOLO de inicios de esa sucursal
        const iniciosActivosRaw = await this.iniciosCajaRepository.find({
            where: { Estatus: In(['Activo', 'Pendiente']) },
            relations: ['Usuario', 'UsuarioAutorizo'],
            order: { FechaInicio: 'DESC' },
        });

        const iniciosActivos = iniciosActivosRaw.filter(
            (i) => i.Usuario?.SucursalID === sucursalId,
        );

        const FondoInicial = Number(iniciosActivos.reduce(
            (s, i) => s + Number(i.MontoInicial ?? 0),
            0,
        ).toFixed(2));

        // 💵 SOLO EFECTIVO: El saldo esperado debe ser solo efectivo físico
        // TotalEfectivo ya incluye: suma de TotalEfectivo de cada corte cerrado
        // Tarjeta y transferencia se muestran informativamente pero NO se incluyen en el saldo esperado
        const SaldoEsperado = Number(TotalEfectivo.toFixed(2));

        // Capturables del dto
        const SaldoRealNumerico = Number(SaldoReal ?? 0);
        const TotalEfectivoCapturadoNumerico = Number(TotalEfectivoCapturado ?? 0);
        const TotalTarjetaCapturadoNumerico = Number(TotalTarjetaCapturado ?? 0);
        const TotalTransferenciaCapturadoNumerico = Number(TotalTransferenciaCapturado ?? 0);

        // 💵 DIFERENCIA SOLO DE EFECTIVO: Comparar efectivo real vs efectivo esperado
        // (antes comparaba suma total vs efectivo esperado, lo cual estaba incorrecto)
        // ✅ CORRECCIÓN P7: Redondear diferencia a 2 decimales para evitar problemas de precisión
        const Diferencia = Number((TotalEfectivoCapturadoNumerico - SaldoEsperado).toFixed(2));

        // ✅ VALIDACIÓN 3: Diferencia significativa requiere observaciones
        if (Math.abs(Diferencia) > 0.01) { // Tolerancia de 1 centavo por redondeo
            // 🔴 CUALQUIER diferencia requiere observaciones
            if (!dto.Observaciones || dto.Observaciones.trim().length === 0) {
                throw new HttpException(
                    `❌ Se requiere una observación cuando existe diferencia entre efectivo esperado y real. ` +
                    `Efectivo esperado: $${SaldoEsperado.toFixed(2)}, ` +
                    `Efectivo capturado: $${TotalEfectivoCapturadoNumerico.toFixed(2)}, ` +
                    `Diferencia: $${Diferencia.toFixed(2)}`,
                    HttpStatus.BAD_REQUEST,
                );
            }

            // Si la diferencia es > 5%, requiere observación MÁS DETALLADA
            if (SaldoEsperado !== 0) {
                const porcentajeDiferencia = (Math.abs(Diferencia) / Math.abs(SaldoEsperado)) * 100;

                if (porcentajeDiferencia > 5) {
                    console.warn(
                        `⚠️ ADVERTENCIA: Diferencia del ${porcentajeDiferencia.toFixed(2)}% en cuadre de caja chica. ` +
                        `Efectivo esperado: $${SaldoEsperado.toFixed(2)}, Efectivo capturado: $${TotalEfectivoCapturadoNumerico.toFixed(2)}, ` +
                        `Diferencia: $${Diferencia.toFixed(2)}`
                    );

                    // Diferencias grandes requieren observación más detallada
                    if (dto.Observaciones.trim().length < 15) {
                        throw new HttpException(
                            `⚠️ Se requiere una observación DETALLADA (mínimo 15 caracteres) cuando la diferencia supera el 5%. ` +
                            `Diferencia actual: $${Diferencia.toFixed(2)} (${porcentajeDiferencia.toFixed(2)}%)`,
                            HttpStatus.BAD_REQUEST,
                        );
                    }
                }
            }
        }

        // ✅ VALIDACIÓN 4: Validar montos capturados vs esperados (con tolerancia)
        const tolerancia = 1.05; // 5% de tolerancia

        if (TotalEfectivoCapturadoNumerico > TotalEfectivo * tolerancia && TotalEfectivo >= 0) {
            console.warn(
                `⚠️ El efectivo capturado ($${TotalEfectivoCapturadoNumerico.toFixed(2)}) excede significativamente ` +
                `el esperado ($${TotalEfectivo.toFixed(2)})`
            );
        }

        if (TotalTarjetaCapturadoNumerico > TotalPagoConTarjeta * tolerancia && TotalPagoConTarjeta > 0) {
            console.warn(
                `⚠️ La tarjeta capturada ($${TotalTarjetaCapturadoNumerico.toFixed(2)}) excede significativamente ` +
                `la esperada ($${TotalPagoConTarjeta.toFixed(2)})`
            );
        }

        if (TotalTransferenciaCapturadoNumerico > TotalTransferencia * tolerancia && TotalTransferencia > 0) {
            console.warn(
                `⚠️ Las transferencias capturadas ($${TotalTransferenciaCapturadoNumerico.toFixed(2)}) exceden significativamente ` +
                `las esperadas ($${TotalTransferencia.toFixed(2)})`
            );
        }

        // Determinar Usuario
        const idUsuarioFinal = usuarioID ?? usuarioID;
        const usuario = await this.usuariosRepository.findOne({
            where: { UsuarioID: idUsuarioFinal },
        });
        if (!usuario) {
            throw new HttpException('❌ Usuario no encontrado', HttpStatus.NOT_FOUND);
        }

        // Determinar Sucursal
        const sucursal = await this.sucursalRepository.findOne({
            where: { SucursalID: sucursalId },
        });

        if (!sucursal) {
            throw new HttpException('❌ Sucursal no encontrada', HttpStatus.NOT_FOUND);
        }

        // 🔥 ACCIÓN CRÍTICA: CERRAR TODOS LOS INICIOS DE CAJA DE LA SUCURSAL
        if (iniciosActivos.length > 0) {
            console.log(`🔒 Cerrando ${iniciosActivos.length} inicio(s) de caja de la sucursal ${sucursalId}...`);

            for (const inicio of iniciosActivos) {
                inicio.Estatus = 'Cerrado';
                console.log(
                    `  ✅ Inicio ${inicio.InicioCajaID} (Usuario: ${inicio.Usuario?.NombreUsuario || 'N/A'}) → Cerrado`
                );
            }

            await this.iniciosCajaRepository.save(iniciosActivos);
            console.log(`✅ ${iniciosActivos.length} inicio(s) cerrado(s) exitosamente`);
        } else {
            console.log('ℹ️ No hay inicios activos para cerrar en esta sucursal');
        }

        // Crear entidad de cuadre
        const nuevo = this.cajaChicaRepository.create({
            Fecha: hoy,
            FechaCierre: new Date(),
            // Fondo inicial (para auditoría)
            FondoInicial, // 👈 Agregar este campo a la entidad si no existe
            // Totales acumulados (ventana por sucursal)
            TotalIngresos,
            TotalEgresos,
            TotalEfectivo,
            TotalPagoConTarjeta,
            TotalTransferencia,
            // Esperado/real
            SaldoEsperado,
            SaldoReal: SaldoRealNumerico,
            TotalEfectivoCapturado: TotalEfectivoCapturadoNumerico,
            TotalTarjetaCapturado: TotalTarjetaCapturadoNumerico,
            TotalTransferenciaCapturado: TotalTransferenciaCapturadoNumerico,
            Diferencia,
            Observaciones: dto.Observaciones ?? null,
            UsuarioCuadre: usuario,
            Sucursal: sucursal,
            FolioCierre:
                dto.FolioCierre ??
                `CC-${new Date()
                    .toISOString()
                    .slice(0, 10)
                    .replace(/-/g, '')}-${Math.floor(Math.random() * 999)
                        .toString()
                        .padStart(3, '0')}`,
            Estatus: 'Cerrado',
            // 👇 Opcional: agregar metadata de inicios cerrados
            // IniciosCerrados: iniciosActivos.map(i => i.InicioCajaID).join(','),
        } as Partial<CajaChica>);

        const guardado = await this.cajaChicaRepository.save(nuevo as CajaChica);

        // 🔗 Ligar todos los cortes cerrados usados en este cuadre con la CajaChica
        for (const corte of cortesCerrados) {
            corte.CajaChica = guardado;
        }
        await this.cortesUsuariosRepository.save(cortesCerrados);

        // Bitácora mejorada
        await this.bitacoraEdicionesRepository.save(
            this.bitacoraEdicionesRepository.create({
                Entidad: 'CajaChica',
                EntidadID: guardado.CajaChicaID,
                CamposModificados: {
                    Estatus: { anterior: 'Pendiente', nuevo: 'Cerrado' },
                    FondoInicial: { anterior: 0, nuevo: FondoInicial },
                    SaldoEsperado: { anterior: 0, nuevo: SaldoEsperado },
                    SaldoReal: { anterior: 0, nuevo: SaldoRealNumerico },
                    Diferencia: { anterior: 0, nuevo: Diferencia },
                    IniciosCerrados: {
                        cantidad: iniciosActivos.length,
                        detalles: iniciosActivos.map(i => ({
                            InicioCajaID: i.InicioCajaID,
                            Usuario: i.Usuario?.NombreUsuario,
                            Monto: Number(i.MontoInicial),
                        }))
                    },
                    CortesProcesados: {
                        cantidad: cortesCerrados.length,
                        usuarios: [...new Set(cortesCerrados.map(c => c.usuarioID?.NombreUsuario))],
                    }
                },
                UsuarioEdicion: String(usuario.UsuarioID),
                FechaEdicion: new Date(),
            }),
        );

        // 📊 LOG FINAL: Resumen completo del cuadre
        console.log('✅ ============ CUADRE DE CAJA CHICA EXITOSO ============');

        console.log(`📅 Período: ${desde.toISOString().split('T')[0]} a ${finDia.toISOString().split('T')[0]}`);
        console.log(`💰 Fondo Inicial: $${FondoInicial.toFixed(2)}`);
        console.log(`📈 Ingresos: $${TotalIngresos.toFixed(2)}`);
        console.log(`📉 Egresos: $${TotalEgresos.toFixed(2)}`);
        console.log(`💵 Efectivo: $${TotalEfectivo.toFixed(2)}`);
        console.log(`💳 Tarjeta: $${TotalPagoConTarjeta.toFixed(2)}`);
        console.log(`🏦 Transferencia: $${TotalTransferencia.toFixed(2)}`);
        console.log(`🎯 Efectivo Esperado: $${SaldoEsperado.toFixed(2)}`);
        console.log(`💼 Efectivo Capturado: $${TotalEfectivoCapturadoNumerico.toFixed(2)}`);
        console.log(`${Diferencia >= 0 ? '✅' : '⚠️'} Diferencia (Efectivo): $${Diferencia.toFixed(2)}`);
        console.log(`🔒 Inicios Cerrados: ${iniciosActivos.length}`);
        console.log(`📋 Cortes Procesados: ${cortesCerrados.length}`);
        console.log(`📄 Folio: ${guardado.FolioCierre}`);
        console.log('========================================================');

        return {
            message: '✅ Cuadre de Caja Chica realizado exitosamente para la sucursal ' + sucursalId,
            cuadre: guardado,
            detalles: {
                iniciosCerrados: iniciosActivos.length,
                cortesProcesados: cortesCerrados.length,
                fondoInicial: FondoInicial,
                diferencia: Diferencia,
                porcentajeDiferencia: SaldoEsperado !== 0
                    ? ((Math.abs(Diferencia) / Math.abs(SaldoEsperado)) * 100).toFixed(2) + '%'
                    : 'N/A',
            },
        };
    }

    // ============================================================
    // 🔹 PATCH /caja-chica/:id/cancelar  (con código)
    // ============================================================
    /**
     * Cancela un cuadre de caja chica con validaciones de integridad
     *
     * REGLAS DE NEGOCIO:
     * 1. No se puede cancelar si ya tiene cuadre de caja general
     * 2. Al cancelar, los cortes asociados se desvinculan y quedan disponibles
     *    para ser incluidos en un nuevo cuadre futuro
     * 3. Se registra la cancelación en bitácora
     *
     * @param id - ID del cuadre a cancelar
     * @param usuario - Usuario que realiza la cancelación
     * @param codigo - Código de autorización
     * @param motivo - Motivo de la cancelación
     */
    async cancelarCuadre(
        id: number,
        usuario: string,
        codigo: string,
        motivo: string,
    ) {
        if (!usuario) {
            throw new HttpException(
                'El usuario es obligatorio',
                HttpStatus.BAD_REQUEST,
            );
        }

        if (!motivo || motivo.trim().length === 0) {
            throw new HttpException(
                'El motivo de cancelación es obligatorio',
                HttpStatus.BAD_REQUEST,
            );
        }

        this.validarCodigoAutorizacion(id, codigo);

        const cuadre = await this.cajaChicaRepository.findOne({
            where: { CajaChicaID: id },
            relations: ['Sucursal'],
        });

        if (!cuadre) {
            throw new HttpException('Cuadre no encontrado', HttpStatus.NOT_FOUND);
        }

        if (cuadre.Estatus === 'Cancelado') {
            throw new HttpException(
                'El cuadre ya está cancelado',
                HttpStatus.BAD_REQUEST,
            );
        }

        console.log('🔍 ===== CANCELANDO CUADRE DE CAJA CHICA =====');
        console.log(`   Caja Chica ID: ${id}`);
        console.log(`   Usuario: ${usuario}`);
        console.log(`   Fecha del cuadre: ${cuadre.Fecha.toISOString()}`);
        console.log(`   Sucursal: ${cuadre.Sucursal?.NombreSucursal || 'N/A'}`);

        // 🔴 VALIDACIÓN 1: Verificar si existe caja general asociada para el mismo día
        // Buscar cuadre de caja general del mismo día y sucursal
        const fechaInicio = new Date(cuadre.Fecha);
        fechaInicio.setHours(0, 0, 0, 0);
        const fechaFin = new Date(cuadre.Fecha);
        fechaFin.setHours(23, 59, 59, 999);

        const cajaGeneral = await this.cajaGeneralRepository.findOne({
            where: {
                Fecha: Between(fechaInicio, fechaFin),
                Estatus: In(['Cerrado', 'Pendiente']),
                ...(cuadre.Sucursal?.SucursalID && {
                    Sucursal: { SucursalID: cuadre.Sucursal.SucursalID },
                }),
            },
            relations: ['Sucursal'],
        });

        if (cajaGeneral) {
            console.log(`   ❌ BLOQUEADO: Existe caja general asociada (ID: ${cajaGeneral.CajaGeneralID})`);
            throw new HttpException(
                `❌ No se puede cancelar este cuadre de caja chica porque ya está incluido en un cuadre de caja general ` +
                `(ID: ${cajaGeneral.CajaGeneralID}, Estatus: ${cajaGeneral.Estatus}, Fecha: ${cajaGeneral.Fecha.toISOString().split('T')[0]}). ` +
                `Para cancelarlo, primero debe cancelar el cuadre de caja general asociado.`,
                HttpStatus.BAD_REQUEST,
            );
        }

        console.log('   ✅ No existe caja general asociada');

        // 🔄 ACCIÓN: Desvincular cortes asociados
        // Los cortes quedarán disponibles para ser incluidos en un nuevo cuadre
        const cortesAsociados = await this.cortesUsuariosRepository.count({
            where: {
                CajaChica: { CajaChicaID: id },
            },
        });

        if (cortesAsociados > 0) {
            console.log(`   🔄 Desvinculando ${cortesAsociados} cortes asociados...`);

            await this.cortesUsuariosRepository.update(
                { CajaChica: { CajaChicaID: id } },
                { CajaChica: null },
            );

            console.log(`   ✅ ${cortesAsociados} cortes desvinculados exitosamente`);
        }

        // 🛑 Cambiar estado a 'Cancelado'
        const observacionOriginal = cuadre.Observaciones || '';
        cuadre.Estatus = 'Cancelado';
        cuadre.Observaciones = `[CANCELADO] ${motivo} - Por: ${usuario} - ${new Date().toISOString()}` +
            (observacionOriginal ? `\n[Observación original]: ${observacionOriginal}` : '');

        await this.cajaChicaRepository.save(cuadre);

        // 📝 Registrar en bitácora
        await this.bitacoraEliminacionesRepository.save(
            this.bitacoraEliminacionesRepository.create({
                Entidad: 'CajaChica',
                EntidadID: id,
                FechaEliminacion: new Date(),
                UsuarioEliminacion: usuario,
                MotivoEliminacion: motivo,
            }),
        );

        console.log('   ✅ CUADRE DE CAJA CHICA CANCELADO EXITOSAMENTE');
        console.log('========================================================');

        return {
            message: '✅ Cuadre de Caja Chica cancelado correctamente.',
            cuadre: {
                CajaChicaID: cuadre.CajaChicaID,
                Fecha: cuadre.Fecha,
                Estatus: cuadre.Estatus,
            },
            cortesDesvinculados: cortesAsociados,
        };
    }


    // ============================================================
    // 🔹 GET /caja-chica/historial
    // ============================================================
    async historial() {
        return this.cajaChicaRepository.find({
            order: { Fecha: 'DESC' },
            relations: ['UsuarioCuadre'],
        });
    }

    // ============================================================
    // 🔎 GET por estatus (con filtros opcionales de fecha)
    // ============================================================
    async listarPorEstatus(
        estatus: EstatusCajaChica,
        rango?: { desde?: string; hasta?: string },
    ) {
        const where: FindOptionsWhere<CajaChica> = { Estatus: estatus };
        if (rango?.desde || rango?.hasta) {
            if (rango.desde && rango.hasta) {
                const { startUTC, endUTC } = this.getLocalDayRangeToUTC(rango.desde);
                const { endUTC: hastaUTC } = this.getLocalDayRangeToUTC(rango.hasta);
                where.Fecha = Between(startUTC, hastaUTC);
            } else if (rango.desde) {
                const { startUTC } = this.getLocalDayRangeToUTC(rango.desde);
                where.Fecha = Between(startUTC, new Date('2999-12-31T23:59:59.999Z'));
            } else if (rango.hasta) {
                const { endUTC } = this.getLocalDayRangeToUTC(rango.hasta);
                where.Fecha = Between(new Date('1970-01-01T00:00:00.000Z'), endUTC);
            }
        }


        return this.cajaChicaRepository.find({
            where,
            order: { Fecha: 'DESC' },
            relations: ['UsuarioCuadre'],
        });
    }

    private getLocalDayRangeToUTC(fecha: string) {
        const base = fecha ? new Date(fecha) : new Date();

        const startLocal = new Date(base);
        startLocal.setHours(0, 0, 0, 0);

        const endLocal = new Date(base);
        endLocal.setHours(23, 59, 59, 999);

        const startUTC = new Date(startLocal.getTime() - startLocal.getTimezoneOffset() * 60000);
        const endUTC = new Date(endLocal.getTime() - endLocal.getTimezoneOffset() * 60000);

        return { startUTC, endUTC };
    }


    // ============================================================
    // ✏️ PATCH capturables/observaciones (NO permitido si 'Cerrado')
    // Recalcula Diferencia = SaldoReal - SaldoEsperado
    // Bitácora de cambios
    // ============================================================
    async actualizarCapturables(
        id: number,
        payload: Partial<{
            Observaciones: string | null;
            SaldoReal: number;
            TotalEfectivoCapturado: number;
            TotalTarjetaCapturado: number;
            TotalTransferenciaCapturado: number;
            Estatus: EstatusCajaChica;
        }>,
        usuarioEdicion: string,
    ) {
        const registro = await this.cajaChicaRepository.findOne({
            where: { CajaChicaID: id },
        });

        if (!registro) {
            throw new HttpException(
                'Registro de Caja Chica no encontrado',
                HttpStatus.NOT_FOUND,
            );
        }

        if (registro.Estatus === 'Cerrado') {
            throw new HttpException(
                'No se pueden editar capturables/observaciones de un cuadre CERRADO.',
                HttpStatus.BAD_REQUEST,
            );
        }

        // Normaliza numéricos
        const n = (v: any) =>
            v === null || v === undefined ? undefined : Number(v);

        const cambios: Partial<CajaChica> = {};
        const difs: Record<string, { anterior: any; nuevo: any }> = {};

        const asigna = (campo: keyof CajaChica, nuevoValor: any) => {
            if (nuevoValor !== undefined && registro[campo] !== nuevoValor) {
                difs[campo as string] = {
                    anterior: registro[campo],
                    nuevo: nuevoValor,
                };
                // 👇 cast explícito para que TS no se queje
                (cambios as any)[campo] = nuevoValor;
            }
        };

        asigna(
            'Observaciones',
            payload.Observaciones ?? registro.Observaciones,
        );
        asigna(
            'SaldoReal',
            n(payload.SaldoReal) ?? registro.SaldoReal,
        );
        asigna(
            'TotalEfectivoCapturado',
            n(payload.TotalEfectivoCapturado) ??
            registro.TotalEfectivoCapturado,
        );
        asigna(
            'TotalTarjetaCapturado',
            n(payload.TotalTarjetaCapturado) ??
            registro.TotalTarjetaCapturado,
        );
        asigna(
            'TotalTransferenciaCapturado',
            n(payload.TotalTransferenciaCapturado) ??
            registro.TotalTransferenciaCapturado,
        );

        // Recalcular Diferencia si cambió SaldoReal o si no existía
        const saldoRealNuevo =
            cambios.SaldoReal !== undefined
                ? Number(cambios.SaldoReal)
                : Number(registro.SaldoReal);

        const saldoEsperado = Number(registro.SaldoEsperado ?? 0);
        const diferenciaNueva = Number(
            (saldoRealNuevo - saldoEsperado).toFixed(2),
        );

        if (registro.Diferencia !== diferenciaNueva) {
            difs['Diferencia'] = {
                anterior: registro.Diferencia,
                nuevo: diferenciaNueva,
            };
            cambios.Diferencia = diferenciaNueva;
        }

        if (Object.keys(cambios).length === 0) {
            throw new HttpException(
                'No hay cambios válidos para actualizar',
                HttpStatus.BAD_REQUEST,
            );
        }

        await this.cajaChicaRepository.update({ CajaChicaID: id }, cambios);

        await this.bitacoraEdicionesRepository.save(
            this.bitacoraEdicionesRepository.create({
                Entidad: 'CajaChica',
                EntidadID: id,
                CamposModificados: difs,
                UsuarioEdicion: String(usuarioEdicion),
                FechaEdicion: new Date(),
            }),
        );

        return this.cajaChicaRepository.findOne({
            where: { CajaChicaID: id },
            relations: ['UsuarioCuadre'],
        });
    }

}
