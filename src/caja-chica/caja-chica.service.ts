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

        @InjectRepository(BitacoraEliminaciones, 'db1')
        private readonly bitacoraEliminacionesRepository: Repository<BitacoraEliminaciones>,
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
    private async ventanaDesdeUltimoCuadre() {
        const { hoy, finDia } = this.rangoDiaActual();

        const ultimo = await this.cajaChicaRepository.findOne({
            where: { Estatus: 'Cerrado' },
            order: { FechaCierre: 'DESC' },
        });

        const desde = ultimo ? new Date(ultimo.FechaCierre) : new Date(0);
        return { desde, finDia, ultimoCuadre: ultimo };
    }

    /**
     * Usuarios con "movimientos" SIN corte CERRADO en la ventana.
     * En ausencia de tabla de movimientos, usamos como proxy:
     *   - IniciosCaja con Estatus Activo/Pendiente en la ventana
     *   - y NO existe un CorteUsuarios CERRADO para ese usuario en la ventana
     */
    private async getUsuariosConMovimientosSinCorte(desde: Date, finDia: Date) {
        // Inicios activos/pendientes en la ventana (proxy de “hubo dinero”)
        const inicios = await this.iniciosCajaRepository.find({
            where: { Estatus: In(['Activo', 'Pendiente']) },
            relations: ['Usuario'],
            order: { FechaInicio: 'DESC' },
        });

        // Filtra los inicios que iniciaron antes del fin de la ventana (vigentes)
        const iniciosEnVentana = inicios.filter(i => new Date(i.FechaInicio) <= finDia);

        if (iniciosEnVentana.length === 0) return [];

        const usuariosIds = [
            ...new Set(iniciosEnVentana.map(i => i.Usuario?.UsuarioID).filter(Boolean)),
        ];

        if (usuariosIds.length === 0) return [];

        // Cortes CERRADOS por esos usuarios en la ventana
        const cortesCerrados = await this.cortesUsuariosRepository.find({
            where: { FechaCorte: Between(desde, finDia), Estatus: 'Cerrado' },
            relations: ['usuarioID'],
        });

        const setUsuariosConCorteCerrado = new Set(
            cortesCerrados.map(c => c.usuarioID?.UsuarioID),
        );

        // Usuarios con inicio activo/pendiente pero SIN corte CERRADO
        const usuariosSinCorte = usuariosIds.filter(
            uid => !setUsuariosConCorteCerrado.has(uid),
        );

        if (usuariosSinCorte.length === 0) return [];

        // Regresa datos útiles para el front
        const detalle = await this.usuariosRepository.findByIds(usuariosSinCorte as number[]);
        return detalle.map(u => ({ UsuarioID: u.UsuarioID, Nombre: u.NombreUsuario }));
    }


    // ============================================================
    // 🔹 GET /caja-chica/precuadre
    //  - Suma cortes de usuario CERRADOS del día
    //  - Prepara capturables en 0 para UI
    // ============================================================


    async precuadre() {
        const { desde, finDia, ultimoCuadre } = await this.ventanaDesdeUltimoCuadre();

        // Cortes CERRADOS en la ventana (desde último cierre hasta hoy)
        const cortesCerrados = await this.cortesUsuariosRepository.find({
            where: { FechaCorte: Between(desde, finDia), Estatus: 'Cerrado' },
            relations: ['usuarioID'],
            order: { FechaCorte: 'DESC' },
        });

        // Cortes PENDIENTES en la misma ventana (alerta/bloqueo)
        const cortesPendientes = await this.cortesUsuariosRepository.find({
            where: { FechaCorte: Between(desde, finDia), Estatus: 'Pendiente' },
            relations: ['usuarioID'],
        });

        // Fondo inicial vigente (suma de inicios activos/pendientes)
        const iniciosActivos = await this.iniciosCajaRepository.find({
            where: { Estatus: In(['Activo', 'Pendiente']) },
            relations: ['Usuario', 'UsuarioAutorizo'],
            order: { FechaInicio: 'DESC' },
        });
        const FondoInicial = iniciosActivos.reduce(
            (s, i) => s + Number(i.MontoInicial ?? 0),
            0,
        );

        // Totales acumulados en la ventana
        const Totales = {
            TotalIngresos: cortesCerrados.reduce((a, b) => a + Number(b.TotalIngresos ?? 0), 0),
            TotalEgresos: cortesCerrados.reduce((a, b) => a + Number(b.TotalEgresos ?? 0), 0),
            TotalEfectivo: cortesCerrados.reduce((a, b) => a + Number(b.TotalEfectivo ?? 0), 0),
            TotalPagoConTarjeta: cortesCerrados.reduce((a, b) => a + Number(b.TotalPagoConTarjeta ?? 0), 0),
            TotalTransferencia: cortesCerrados.reduce((a, b) => a + Number(b.TotalTransferencia ?? 0), 0),
        };

        // SaldoEsperado = FondoInicial + (Ingresos - Egresos)
        const SaldoEsperado = Number(FondoInicial) + (Totales.TotalIngresos - Totales.TotalEgresos);

        // Validación 1 exacta: usuarios con “movimientos” (proxy: InicioCaja activo) y SIN corte CERRADO
        const usuariosMovSinCorte = await this.getUsuariosConMovimientosSinCorte(desde, finDia);

        // Usuarios sin corte CERRADO (para tablero general, no bloqueo por sí mismo)
        const usuariosConCorteCerrado = new Set(cortesCerrados.map(c => c.usuarioID?.UsuarioID));
        const todosUsuarios = await this.usuariosRepository.find();
        const usuariosPendientesDeCorte = todosUsuarios.filter(u => !usuariosConCorteCerrado.has(u.UsuarioID));

        return {
            // Contexto
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
            IniciosActivos: iniciosActivos.map(i => ({
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
            UsuariosConMovimientosSinCorte: usuariosMovSinCorte,         // ← BLOQUEO duro para cuadrar
            PendientesDeCorte: usuariosPendientesDeCorte.length,         // info
            UsuariosPendientes: usuariosPendientesDeCorte.map(u => ({ UsuarioID: u.UsuarioID, Nombre: u.NombreUsuario })),

            // Mensajes para front
            mensajes: [
                ...(ultimoCuadre
                    ? [`Se acumula desde el último cuadre (cerrado el ${ultimoCuadre.FechaCierre.toISOString()}).`]
                    : ['No hay cuadre previo; se acumula todo el historial.']),
                ...(iniciosActivos.length === 0
                    ? ['No hay Inicios de Caja activos/pendientes; FondoInicial=0.']
                    : [`Existen ${iniciosActivos.length} inicio(s) de caja activos/pendientes (FondoInicial=${FondoInicial.toFixed(2)}).`]),
                ...(cortesPendientes.length > 0
                    ? [`Hay ${cortesPendientes.length} corte(s) de usuario PENDIENTE en la ventana; no se debe cuadrar.`]
                    : []),
                ...(usuariosMovSinCorte.length > 0
                    ? [`Bloqueo: ${usuariosMovSinCorte.length} usuario(s) con movimientos sin corte.`]
                    : []),
            ],

            // Sugerencia UX: si SaldoEsperado > 0, la caja NO está “en 0” (hasta que se cuadre)
            CajaEnCeroSoloTrasCuadre: false,
            DebeCuadrarseHoy: (Totales.TotalIngresos + Totales.TotalEgresos) > 0, // hay actividad
        };
    }



    // ============================================================
    // 🔹 POST /caja-chica/cuadrar
    //  - Valida que no existan cortes de usuario PENDIENTE hoy
    //  - Valida que no exista ya un Cuadre (Cerrado|Pendiente) hoy
    //  - Calcula SaldoEsperado y guarda capturados + Folio + Cierre
    // ============================================================
    async cuadrarCajaChica(usuarioID: number, dto: CreateCajaChicaDto) {
        const { desde, finDia } = await this.ventanaDesdeUltimoCuadre();

        // (A) BLOQUEO por cortes PENDIENTES en la ventana
        const hayPendientes = await this.cortesUsuariosRepository.count({
            where: { FechaCorte: Between(desde, finDia), Estatus: 'Pendiente' },
        });
        if (hayPendientes > 0) {
            throw new HttpException(
                `No se puede cuadrar: existen ${hayPendientes} corte(s) de usuario con estatus PENDIENTE en la ventana.`,
                HttpStatus.BAD_REQUEST,
            );
        }

        // (B) BLOQUEO por “usuarios con movimientos” sin corte CERRADO
        const usuariosMovSinCorte = await this.getUsuariosConMovimientosSinCorte(desde, finDia);
        if (usuariosMovSinCorte.length > 0) {
            const lista = usuariosMovSinCorte.map(u => `${u.UsuarioID}-${u.Nombre}`).join(', ');
            throw new HttpException(
                `No se puede cuadrar: usuarios con movimientos sin corte CERRADO: ${lista}.`,
                HttpStatus.BAD_REQUEST,
            );
        }

        // (C) BLOQUEO si ya existiera cuadre (Cerrado|Pendiente) HOY
        const { hoy } = this.rangoDiaActual();
        const cuadreExistente = await this.cajaChicaRepository.findOne({
            where: { Fecha: Between(hoy, finDia), Estatus: In(['Cerrado', 'Pendiente']) },
        });
        if (cuadreExistente) {
            throw new HttpException(
                `Ya existe un cuadre de caja chica con estatus '${cuadreExistente.Estatus}' para el día de hoy.`,
                HttpStatus.BAD_REQUEST,
            );
        }

        // Totales acumulados en ventana
        const cortesCerrados = await this.cortesUsuariosRepository.find({
            where: { FechaCorte: Between(desde, finDia), Estatus: 'Cerrado' },
        });
        if (cortesCerrados.length === 0) {
            throw new HttpException(
                'No hay cortes de usuario CERRADOS en la ventana. No es posible realizar el cuadre.',
                HttpStatus.BAD_REQUEST,
            );
        }

        const TotalIngresos = cortesCerrados.reduce((a, b) => a + Number(b.TotalIngresos ?? 0), 0);
        const TotalEgresos = cortesCerrados.reduce((a, b) => a + Number(b.TotalEgresos ?? 0), 0);
        const TotalEfectivo = cortesCerrados.reduce((a, b) => a + Number(b.TotalEfectivo ?? 0), 0);
        const TotalPagoConTarjeta = cortesCerrados.reduce((a, b) => a + Number(b.TotalPagoConTarjeta ?? 0), 0);
        const TotalTransferencia = cortesCerrados.reduce((a, b) => a + Number(b.TotalTransferencia ?? 0), 0);

        // FondoInicial vigente
        const iniciosActivos = await this.iniciosCajaRepository.find({
            where: { Estatus: In(['Activo', 'Pendiente']) },
        });
        const FondoInicial = iniciosActivos.reduce((s, i) => s + Number(i.MontoInicial ?? 0), 0);

        // Saldo esperado con fondo
        const SaldoEsperado = Number(FondoInicial) + (TotalIngresos - TotalEgresos);

        // Capturables del dto
        const SaldoReal = Number(dto.SaldoReal ?? 0);
        const TotalEfectivoCapturado = Number(dto.TotalEfectivoCapturado ?? 0);
        const TotalTarjetaCapturado = Number(dto.TotalTarjetaCapturado ?? 0);
        const TotalTransferenciaCapturado = Number(dto.TotalTransferenciaCapturado ?? 0);

        const Diferencia = Number(SaldoReal) - Number(SaldoEsperado);

        const usuario = await this.usuariosRepository.findOne({ where: { UsuarioID: usuarioID } });
        if (!usuario) throw new HttpException('Usuario no encontrado', HttpStatus.NOT_FOUND);

        const nuevo = this.cajaChicaRepository.create({
            Fecha: hoy,
            FechaCierre: new Date(),
            // Totales acumulados (ventana)
            TotalIngresos,
            TotalEgresos,
            TotalEfectivo,
            TotalPagoConTarjeta,
            TotalTransferencia,
            // Fondo + esperado/real
            SaldoEsperado,
            SaldoReal,
            TotalEfectivoCapturado,
            TotalTarjetaCapturado,
            TotalTransferenciaCapturado,
            Diferencia,
            Observaciones: dto.Observaciones ?? null,
            UsuarioCuadre: usuario,
            FolioCierre: `CC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 999).toString().padStart(3, '0')}`,
            Estatus: 'Cerrado',
        });

        const guardado = await this.cajaChicaRepository.save(nuevo);

        await this.bitacoraEdicionesRepository.save(
            this.bitacoraEdicionesRepository.create({
                Entidad: 'CajaChica',
                EntidadID: guardado.CajaChicaID,
                CamposModificados: {
                    Estatus: { anterior: 'Pendiente', nuevo: 'Cerrado' },
                    FondoInicial: { anterior: 0, nuevo: FondoInicial },
                    SaldoEsperado: { anterior: 0, nuevo: SaldoEsperado },
                    SaldoReal: { anterior: 0, nuevo: SaldoReal },
                    Diferencia: { anterior: 0, nuevo: Diferencia },
                },
                UsuarioEdicion: String(usuario.UsuarioID),
                FechaEdicion: new Date(),
            }),
        );

        return {
            message: '✅ Cuadre de Caja Chica realizado exitosamente.',
            cuadre: guardado,
        };
    }


    // ============================================================
    // 🔹 PATCH /caja-chica/:id/cancelar  (con código)
    // ============================================================
    async cancelarCuadre(id: number, usuario: string, codigo: string, motivo: string) {
        if (!usuario) {
            throw new HttpException('El usuario es obligatorio', HttpStatus.BAD_REQUEST);
        }

        this.validarCodigoAutorizacion(id, codigo);

        const cuadre = await this.cajaChicaRepository.findOne({ where: { CajaChicaID: id } });
        if (!cuadre) {
            throw new HttpException('Cuadre no encontrado', HttpStatus.NOT_FOUND);
        }

        if (cuadre.Estatus === 'Cancelado') {
            throw new HttpException('El cuadre ya está cancelado', HttpStatus.BAD_REQUEST);
        }

        cuadre.Estatus = 'Cancelado';
        cuadre.Observaciones = motivo || 'Cancelado manualmente';
        await this.cajaChicaRepository.save(cuadre);

        await this.bitacoraEliminacionesRepository.save(
            this.bitacoraEliminacionesRepository.create({
                Entidad: 'CajaChica',
                EntidadID: id,
                FechaEliminacion: new Date(),
                UsuarioEliminacion: usuario,                 // 👈 nombre correcto
                MotivoEliminacion: motivo || 'Cancelación',  // 👈 nombre correcto
            }),
        );


        return { message: '🛑 Cuadre de Caja Chica cancelado correctamente.' };
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
            const desde = rango?.desde ? new Date(`${rango.desde} 00:00:00`) : undefined;
            const hasta = rango?.hasta ? new Date(`${rango.hasta} 23:59:59`) : undefined;

            if (desde && hasta) where.Fecha = Between(desde, hasta);
            else if (desde) where.Fecha = Between(desde, new Date('2999-12-31'));
            else if (hasta) where.Fecha = Between(new Date('1970-01-01'), hasta);
        }

        return this.cajaChicaRepository.find({
            where,
            order: { Fecha: 'DESC' },
            relations: ['UsuarioCuadre'],
        });
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
            Estatus: EstatusCajaChica; // opcionalmente permitir cambio a 'Pendiente'/'Cancelado' si lo ocupas
        }>,
        usuarioEdicion: string, // pasa el nombre o id como string
    ) {
        const registro = await this.cajaChicaRepository.findOne({
            where: { CajaChicaID: id },
        });

        if (!registro) {
            throw new HttpException('Registro de Caja Chica no encontrado', HttpStatus.NOT_FOUND);
        }

        if (registro.Estatus === 'Cerrado') {
            throw new HttpException(
                'No se pueden editar capturables/observaciones de un cuadre CERRADO.',
                HttpStatus.BAD_REQUEST,
            );
        }

        // Normaliza numéricos (evita NaN)
        const n = (v: any) => (v === null || v === undefined ? undefined : Number(v));

        const cambios: Partial<CajaChica> = {};
        const difs: Record<string, { anterior: any; nuevo: any }> = {};

        const asigna = (campo: keyof CajaChica, nuevoValor: any) => {
            if (nuevoValor !== undefined && registro[campo] !== nuevoValor) {
                difs[campo as string] = { anterior: registro[campo], nuevo: nuevoValor };
                const cambios: Partial<Record<keyof CajaChica, any>> = {};

            }
        };

        asigna('Observaciones', payload.Observaciones ?? registro.Observaciones);
        asigna('SaldoReal', n(payload.SaldoReal) ?? registro.SaldoReal);
        asigna('TotalEfectivoCapturado', n(payload.TotalEfectivoCapturado) ?? registro.TotalEfectivoCapturado);
        asigna('TotalTarjetaCapturado', n(payload.TotalTarjetaCapturado) ?? registro.TotalTarjetaCapturado);
        asigna('TotalTransferenciaCapturado', n(payload.TotalTransferenciaCapturado) ?? registro.TotalTransferenciaCapturado);

        // Recalcular Diferencia si vino SaldoReal o si no existía
        const saldoRealNuevo =
            cambios.SaldoReal !== undefined ? Number(cambios.SaldoReal) : Number(registro.SaldoReal);
        const saldoEsperado = Number(registro.SaldoEsperado ?? 0);

        const diferenciaNueva = Number((saldoRealNuevo - saldoEsperado).toFixed(2));
        if (registro.Diferencia !== diferenciaNueva) {
            difs['Diferencia'] = { anterior: registro.Diferencia, nuevo: diferenciaNueva };
            cambios.Diferencia = diferenciaNueva;
        }

        if (Object.keys(cambios).length === 0) {
            throw new HttpException('No hay cambios válidos para actualizar', HttpStatus.BAD_REQUEST);
        }

        // Persistir
        await this.cajaChicaRepository.update({ CajaChicaID: id }, cambios);

        // Bitácora
        await this.bitacoraEdicionesRepository.save(
            this.bitacoraEdicionesRepository.create({
                Entidad: 'CajaChica',
                EntidadID: id,
                CamposModificados: difs,
                UsuarioEdicion: String(usuarioEdicion),
                FechaEdicion: new Date(),
            }),
        );

        // Devuelve registro actualizado
        return this.cajaChicaRepository.findOne({
            where: { CajaChicaID: id },
            relations: ['UsuarioCuadre'],
        });
    }
}
