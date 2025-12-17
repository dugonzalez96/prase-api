import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, IsNull, MoreThanOrEqual, Not, Repository } from 'typeorm';
import { IniciosCaja } from 'src/inicios-caja/entities/inicios-caja.entity';
import { Transacciones } from 'src/transacciones/entities/transacciones.entity';
import { PagosPoliza } from 'src/pagos-poliza/entities/pagos-poliza.entity';
import { CortesUsuarios } from './entities/cortes-usuarios.entity';
import {
  CreateCorteUsuarioDto,
  GenerateCorteUsuarioDto,
  UpdateCorteUsuarioDto,
} from './dto/cortes-usuarios.dto';
import { BitacoraEdiciones } from 'src/bitacora-ediciones/bitacora-ediciones.entity';
import { BitacoraEliminaciones } from 'src/bitacora-eliminaciones/bitacora-eliminaciones.entity';
import { usuarios } from 'src/users/users.entity';
import { Poliza } from 'src/polizas/entities/poliza.entity';
import { Sucursal } from 'src/sucursales/entities/sucursales.entity';

@Injectable()
export class CortesUsuariosService {
  constructor(
    @InjectRepository(IniciosCaja, 'db1')
    private readonly iniciosCajaRepository: Repository<IniciosCaja>,

    @InjectRepository(Transacciones, 'db1')
    private readonly transaccionesRepository: Repository<Transacciones>,

    @InjectRepository(PagosPoliza, 'db1')
    private readonly pagosPolizaRepository: Repository<PagosPoliza>,

    @InjectRepository(CortesUsuarios, 'db1')
    private readonly cortesUsuariosRepository: Repository<CortesUsuarios>,

    @InjectRepository(BitacoraEdiciones, 'db1')
    private readonly bitacoraEdicionesRepository: Repository<BitacoraEdiciones>,

    @InjectRepository(BitacoraEliminaciones, 'db1')
    private readonly bitacoraEliminacionesRepository: Repository<BitacoraEliminaciones>,

    @InjectRepository(usuarios, 'db1')
    private readonly usersRepository: Repository<usuarios>,

    @InjectRepository(Sucursal, 'db1')
    private readonly sucursalRepository: Repository<Sucursal>,

    @InjectRepository(Poliza, 'db1')
    private readonly polizaRepository: Repository<Poliza>


  ) { }

  async getAllCortes(): Promise<CortesUsuarios[]> {
    return this.cortesUsuariosRepository.find({
      relations: ['usuarioID'], // 🔹 Incluir relación con usuarios directamente
      order: { FechaCorte: 'DESC' },
    });
  }

  /**
   * 🔹 Obtener todos los cortes del día actual
   */
  async getCortesDelDia(): Promise<CortesUsuarios[]> {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0); // Inicio del día

    const finDia = new Date();
    finDia.setHours(23, 59, 59, 999); // Fin del día

    console.log(finDia);

    return this.cortesUsuariosRepository.find({
      where: {
        FechaCorte: Between(hoy, finDia),
      },
      relations: ['usuarioID', 'InicioCaja'],
      order: {
        FechaCorte: 'DESC',
      },
    });
  }

  /**
   * 🔹 Obtener cortes de caja con estatus "Cancelado" por usuario
   */
  async getCorteCanceladoByUser(usuarioID: number): Promise<CortesUsuarios[]> {
    return this.cortesUsuariosRepository.find({
      where: {
        usuarioID: { UsuarioID: usuarioID }, // ✅ Buscar directamente en la relación con usuarios
        Estatus: 'Cancelado',
      },
      relations: ['usuarioID'], // ✅ Asegurar que se cargue la relación con usuarios
      order: { FechaCorte: 'DESC' },
    });
  }

  /**
   * 🔹 Obtener cortes de caja con estatus "Cerrado" por usuario
   */
  async getCorteCerradoByUser(usuarioID: number): Promise<CortesUsuarios[]> {
    return this.cortesUsuariosRepository.find({
      where: {
        usuarioID: { UsuarioID: usuarioID }, // ✅ Buscar directamente por usuarioID
        Estatus: 'Cerrado',
      },
      relations: ['usuarioID', 'InicioCaja'],
      order: { FechaCorte: 'DESC' },
    });
  }

  /**
   * 🔹 Obtener el corte de caja "Cerrado" del día para un usuario
   */
  async getCorteCerradoByUserByDay(
    usuarioID: number,
  ): Promise<CortesUsuarios | null> {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const mañana = new Date(hoy);
    mañana.setDate(mañana.getDate() + 1);

    return this.cortesUsuariosRepository.findOne({
      where: {
        usuarioID: { UsuarioID: usuarioID }, // ✅ Buscar el usuario directamente en la entidad
        FechaCorte: Between(hoy, mañana), // 🔹 Solo el corte del día actual
        Estatus: 'Cerrado',
      },
      relations: ['usuarioID', 'InicioCaja'],
      order: { FechaCorte: 'DESC' },
    });
  }

  /**
   * 🔹 Obtener un corte de caja por ID
   */
  async getCorteById(corteID: number): Promise<CortesUsuarios> {
    const corte = await this.cortesUsuariosRepository.findOne({
      where: { CorteUsuarioID: corteID },
      relations: ['usuarioID', 'InicioCaja'], // ✅ Asegurar que cargue el usuario
    });

    if (!corte) {
      throw new HttpException(
        'Corte de caja no encontrado',
        HttpStatus.NOT_FOUND,
      );
    }
    return corte;
  }

  async getCorteConHistorialById(corteID: number) {
    const corte = await this.getCorteById(corteID); // 🔹 Usa el método ya existente

    const historial = await this.getCorteHistorialById(corteID); // 🔹 Cálculos y desglose

    return {
      corte, // Datos generales del corte (usuario, inicio caja, etc.)
      historial, // Totales, diferencias, desglose de ingresos/egresos
    };
  }

  /**
   * 🔹 Obtener todos los cortes de caja de un usuario
   */
  async getCortesByUsuario(usuarioID: number): Promise<CortesUsuarios[]> {
    return this.cortesUsuariosRepository.find({
      where: { usuarioID: { UsuarioID: usuarioID } }, // ✅ Relación directa con usuario
      relations: ['usuarioID', 'InicioCaja'],
      order: { FechaCorte: 'DESC' },
    });
  }

  /**
   * 🔍 Obtener usuarios que aún NO tienen corte registrado el día actual
   */
  /**
   * 🔍 Obtener usuarios que necesitan hacer corte de caja
   * 
   * Lógica:
   * - Usuarios CON cortes previos: si tienen movimientos desde su último corte hasta hoy
   * - Usuarios SIN cortes previos: si tienen movimientos HOY
   */
  async getUsuariosSinCorteHoy(): Promise<any[]> {
    // 🌍 Trabajar en UTC como lo hace generarCorteCaja
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const finDia = new Date();
    finDia.setHours(23, 59, 59, 999);

    console.log('🕒 Rango en hora local:', hoy, finDia);
    console.log('🕒 Rango en UTC:', hoy.toISOString(), finDia.toISOString());

    // 1️⃣ Traer todos los usuarios activos
    const usuarios = await this.usersRepository.find();

    // 2️⃣ Traer cortes del día
    const cortesDelDia = await this.cortesUsuariosRepository.find({
      where: {
        FechaCorte: Between(hoy, finDia),
        Estatus: Not('Cancelado'),
      },
      relations: ['usuarioID'],
    });

    // 3️⃣ Set de usuarios con corte hoy
    const usuariosConCorteHoy = new Set(
      cortesDelDia.map((corte) => corte.usuarioID.UsuarioID),
    );

    // 4️⃣ Filtrar usuarios sin corte hoy
    const usuariosSinCorteHoy = usuarios.filter(
      (u) => !usuariosConCorteHoy.has(u.UsuarioID),
    );

    const usuariosCandidatos = [];

    for (const usuario of usuariosSinCorteHoy) {
      // 📅 Buscar último corte
      const ultimoCorte = await this.cortesUsuariosRepository.findOne({
        where: {
          usuarioID: { UsuarioID: usuario.UsuarioID },
          Estatus: Not('Cancelado'),
        },
        order: { FechaCorte: 'DESC' },
      });

      let fechaDesde: Date;

      if (ultimoCorte) {
        // 🔹 Usuario CON cortes: desde día del último corte
        fechaDesde = new Date(ultimoCorte.FechaCorte);
        // ⚠️ NO resetear a 00:00:00 porque queremos desde DESPUÉS del corte
        // Si el corte fue a las 10 PM, queremos transacciones desde las 10 PM en adelante
        // PERO si queremos considerar todo el día siguiente, entonces sí:
        fechaDesde.setHours(0, 0, 0, 0);
      } else {
        // 🔹 Usuario SIN cortes: solo movimientos de HOY
        fechaDesde = new Date(hoy);
      }

      const fechaHasta = new Date(finDia);

      console.log(`🔍 Usuario: ${usuario.NombreUsuario}`);
      console.log(`   📅 Último corte: ${ultimoCorte?.FechaCorte || 'NUNCA'}`);
      console.log(`   🕒 Buscando desde: ${fechaDesde.toISOString()}`);
      console.log(`   🕒 Buscando hasta: ${fechaHasta.toISOString()}`);

      // 🔍 Buscar transacciones
      const transacciones = await this.transaccionesRepository.count({
        where: {
          UsuarioCreo: { UsuarioID: usuario.UsuarioID },
          FechaTransaccion: Between(fechaDesde, fechaHasta),
        },
      });

      // 🔍 Buscar pagos de póliza
      const pagosPoliza = await this.pagosPolizaRepository.count({
        where: {
          Usuario: { UsuarioID: usuario.UsuarioID },
          FechaPago: Between(fechaDesde, fechaHasta),
          MotivoCancelacion: IsNull(),
        },
      });

      console.log(`   📊 Resultado: ${transacciones} transacciones, ${pagosPoliza} pagos`);

      // ✅ Si tiene movimientos, es candidato
      if (transacciones > 0 || pagosPoliza > 0) {
        usuariosCandidatos.push({
          UsuarioID: usuario.UsuarioID,
          Nombre: usuario.NombreUsuario,
          ultimoCorte: ultimoCorte?.FechaCorte || null,
          diasSinCorte: ultimoCorte
            ? Math.floor((new Date().getTime() - new Date(ultimoCorte.FechaCorte).getTime()) / (1000 * 60 * 60 * 24))
            : 0,
          movimientosPendientes: transacciones + pagosPoliza,
          transacciones,
          pagosPoliza,
        });
      }
    }

    return usuariosCandidatos;
  }
  /**
   * 🔹 Actualizar un corte de caja
   */
  async updateCorte(
    corteID: number,
    updateDto: UpdateCorteUsuarioDto,
    usuarioEdicion: string,
  ): Promise<CortesUsuarios> {
    const corte = await this.getCorteById(corteID);

    if (!corte) {
      throw new HttpException(
        'Corte de caja no encontrado',
        HttpStatus.NOT_FOUND,
      );
    }

    // Solo se permiten actualizar estos campos
    const camposPermitidos: (keyof UpdateCorteUsuarioDto)[] = [
      'SaldoReal',
      'TotalEfectivoCapturado',
      'TotalTarjetaCapturado',
      'TotalTransferenciaCapturado',
      'Diferencia',
      'Observaciones',
      'Estatus',
    ];

    let hayCambios = false;
    const cambios: Partial<
      Record<keyof CortesUsuarios, string | number | Date | null>
    > = {};
    const camposModificados: Record<
      string,
      {
        anterior: string | number | Date | null;
        nuevo: string | number | Date | null;
      }
    > = {};

    camposPermitidos.forEach((campo) => {
      const key = campo as keyof CortesUsuarios; // 🔹 Convertir el campo a una clave válida

      if (updateDto[key] !== undefined) {
        // ✅ Se asegura que cambios almacene solo los valores válidos
        cambios[key] = updateDto[key] as string | number | Date | null;

        // 📌 Registrar cambios en la bitácora si hay diferencia
        if (corte[key] !== updateDto[key]) {
          camposModificados[key as string] = {
            anterior: corte[key] as string | number | Date | null,
            nuevo: updateDto[key] as string | number | Date | null,
          };
          hayCambios = true;
        }
      }
    });

    if (!hayCambios) {
      throw new HttpException(
        'No hay cambios válidos para actualizar',
        HttpStatus.BAD_REQUEST,
      );
    }

    // 🔹 **Si el estatus cambia a "Cancelado", activar el Inicio de Caja**
    if (updateDto.Estatus === 'Cancelado' && corte.InicioCaja) {
      console.log(
        '🔹 Activando Inicio de Caja:',
        corte.InicioCaja.InicioCajaID,
      );

      await this.iniciosCajaRepository.update(
        { InicioCajaID: corte.InicioCaja.InicioCajaID },
        { Estatus: 'Activo' },
      );

      const inicioCajaVerificado = await this.iniciosCajaRepository.findOne({
        where: { InicioCajaID: corte.InicioCaja.InicioCajaID },
      });

      console.log(
        '🔹 Inicio de caja después de update():',
        inicioCajaVerificado,
      );
    }

    // Actualizar la fecha de actualización automáticamente
    cambios.FechaActualizacion = new Date();

    Object.assign(corte, cambios);
    const corteActualizado = await this.cortesUsuariosRepository.save(corte);

    // **Registrar en la Bitácora de Ediciones**
    const bitacora = this.bitacoraEdicionesRepository.create({
      Entidad: 'CortesUsuarios',
      EntidadID: corteActualizado.CorteUsuarioID,
      CamposModificados: corte,
      UsuarioEdicion: usuarioEdicion, // Pasar el usuario que hizo la edición
    });
    await this.bitacoraEdicionesRepository.save(bitacora);

    return corteActualizado;
  }

  /*async generarCorteCaja(usuarioID: number): Promise<GenerateCorteUsuarioDto> {
    // Obtener la fecha actual en formato YYYY-MM-DD para el filtro
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const mañana = new Date(hoy);
    mañana.setDate(mañana.getDate() + 1);

    console.info(hoy);

    // Buscar inicio de caja activo del usuario
    const inicioCaja = await this.iniciosCajaRepository.findOne({
      where: { Usuario: { UsuarioID: usuarioID } },
    });

    console.log(inicioCaja);

    // **OBTENER TRANSACCIONES DEL USUARIO FILTRADAS POR FECHA**
    const ingresos =
      (await this.transaccionesRepository.find({
        where: {
          TipoTransaccion: 'Ingreso',
          UsuarioCreo: { UsuarioID: usuarioID },
          FechaTransaccion: Between(hoy, mañana),
        },
      })) || [];

    const egresos =
      (await this.transaccionesRepository.find({
        where: {
          TipoTransaccion: 'Egreso',
          UsuarioCreo: { UsuarioID: usuarioID },
          FechaTransaccion: Between(hoy, mañana),
        },
      })) || [];

    // **OBTENER PAGOS DE PÓLIZA DEL USUARIO FILTRADOS POR FECHA**
    const pagosPoliza =
      (await this.pagosPolizaRepository.find({
        where: {
          MotivoCancelacion: null,
          Usuario: { UsuarioID: usuarioID },
          FechaPago: Between(hoy, mañana),
        },
        relations: ['MetodoPago'], // Asegurar que la relación esté cargada
      })) || [];

    let totalIngresos = 0,
      totalEgresos = 0;
    let totalIngresosEfectivo = 0,
      totalIngresosTarjeta = 0,
      totalIngresosTransferencia = 0;
    let totalEgresosEfectivo = 0,
      totalEgresosTarjeta = 0,
      totalEgresosTransferencia = 0;

    // **SUMAMOS LOS INGRESOS**
    ingresos.forEach((transaccion) => {
      totalIngresos += Number(transaccion.Monto);
      if (transaccion.FormaPago === 'Efectivo')
        totalIngresosEfectivo += Number(transaccion.Monto);
      if (transaccion.FormaPago === 'Tarjeta')
        totalIngresosTarjeta += Number(transaccion.Monto);
      if (
        transaccion.FormaPago === 'Transferencia' ||
        transaccion.FormaPago === 'Deposito'
      )
        totalIngresosTransferencia += Number(transaccion.Monto);
    });

    // **SUMAMOS LOS EGRESOS**
    egresos.forEach((transaccion) => {
      totalEgresos += Number(transaccion.Monto);
      if (transaccion.FormaPago === 'Efectivo')
        totalEgresosEfectivo += Number(transaccion.Monto);
      if (transaccion.FormaPago === 'Tarjeta')
        totalEgresosTarjeta += Number(transaccion.Monto);
      if (
        transaccion.FormaPago === 'Transferencia' ||
        transaccion.FormaPago === 'Deposito'
      )
        totalEgresosTransferencia += Number(transaccion.Monto);
    });

    // **SUMAMOS LOS PAGOS DE PÓLIZA COMO INGRESOS**
    pagosPoliza.forEach((pago) => {
      totalIngresos += Number(pago.MontoPagado);
      if (pago.MetodoPago.IDMetodoPago === 3)
        totalIngresosEfectivo += Number(pago.MontoPagado);
      if (pago.MetodoPago.IDMetodoPago === 4)
        totalIngresosTarjeta += Number(pago.MontoPagado);
      if ([1, 2].includes(pago.MetodoPago.IDMetodoPago))
        totalIngresosTransferencia += Number(pago.MontoPagado);
    });

    // **CALCULAMOS EL SALDO ESPERADO**
    const saldoEsperado =
      Number(inicioCaja.MontoInicial) + totalIngresos - totalEgresos;

    // **🔥 CORRECCIÓN: INICIOS NO TIENE "TOTAL CON TARJETA"**
    const totalEfectivo =
      Number(inicioCaja.TotalEfectivo) +
      totalIngresosEfectivo -
      totalEgresosEfectivo;
    console.log('inicios caja' + totalEgresosTransferencia);
    const totalTransferencia =
      Number(inicioCaja.TotalTransferencia) +
      totalIngresosTransferencia -
      totalEgresosTransferencia;

    // 🔴 **ANTES ESTABA MAL**:
    // const totalPagoConTarjeta = Number(inicioCaja.TotalTransferencia) + totalIngresosTarjeta - totalEgresosTarjeta;

    // ✅ **CORRECCIÓN: Solo se suman ingresos y se restan egresos**
    const totalPagoConTarjeta = totalIngresosTarjeta - totalEgresosTarjeta;

    // **VALIDACIÓN DE PAGOS NO VALIDADOS**
    const pagosNoValidados = pagosPoliza.filter(
      (pago) => pago.MetodoPago.IDMetodoPago !== 3 && !pago.Validado,
    );

    if (pagosNoValidados.length > 0) {
      throw new HttpException(
        `SE REQUIERE VALIDAR ${pagosNoValidados.length} PAGOS QUE NO SE REALIZARON EN EFECTIVO`,
        HttpStatus.BAD_REQUEST,
      );
    }

    return {
      TotalIngresos: totalIngresos,
      TotalIngresosEfectivo: totalIngresosEfectivo,
      TotalIngresosTarjeta: totalIngresosTarjeta,
      TotalIngresosTransferencia: totalIngresosTransferencia,
      TotalEgresos: totalEgresos,
      TotalEgresosEfectivo: totalEgresosEfectivo,
      TotalEgresosTarjeta: totalEgresosTarjeta,
      TotalEgresosTransferencia: totalEgresosTransferencia,
      TotalEfectivo: totalEfectivo,
      TotalPagoConTarjeta: totalPagoConTarjeta,
      TotalTransferencia: totalTransferencia,
      SaldoEsperado: saldoEsperado,
      SaldoReal: 0,
      TotalEfectivoCapturado: 0,
      TotalTarjetaCapturado: 0,
      TotalTransferenciaCapturado: 0,
      Diferencia: 0,
      Observaciones: '',
      Estatus: 'Pendiente',
    };
  }*/


  async generarCorteCaja(usuarioID: number): Promise<GenerateCorteUsuarioDto> {
    // 🔍 ARRASTRE DE SALDOS: Buscar último corte CERRADO (no Cancelado, no Pendiente)
    // Esto permite múltiples cortes en un día - cada corte calcula desde el anterior
    const ultimoCorte = await this.cortesUsuariosRepository.findOne({
      where: {
        usuarioID: { UsuarioID: usuarioID },
        Estatus: 'Cerrado',
      },
      order: { FechaCorte: 'DESC' },
    });

    const inicioCaja = await this.iniciosCajaRepository.findOne({
      where: { Usuario: { UsuarioID: usuarioID } },
    });

    if (!inicioCaja) {
      throw new HttpException(
        'El usuario no tiene un Inicio de Caja activo',
        HttpStatus.BAD_REQUEST,
      );
    }

    let fechaReferencia: Date;
    if (ultimoCorte) {
      fechaReferencia = new Date(ultimoCorte.FechaCorte);
    } else {
      fechaReferencia = new Date(inicioCaja.FechaInicio);
    }

    const formatoFecha = (fecha: Date) => {
      const year = fecha.getFullYear();
      const month = String(fecha.getMonth() + 1).padStart(2, '0');
      const day = String(fecha.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const fechaBusqueda = formatoFecha(fechaReferencia);

    const transaccionesNoValidadas = await this.transaccionesRepository
      .createQueryBuilder('t')
      .leftJoin('t.UsuarioCreo', 'u')
      .where('u.UsuarioID = :usuarioID', { usuarioID })
      .andWhere('DATE(t.FechaTransaccion) >= :fecha', { fecha: fechaBusqueda })
      .andWhere('t.FormaPago IN (:...formasPago)', { formasPago: ['Transferencia', 'Deposito', 'Tarjeta'] })
      .andWhere('t.Validado = :validado', { validado: false })
      .getMany();

    if (transaccionesNoValidadas.length > 0) {
      throw new HttpException(
        `No se puede generar el corte: hay ${transaccionesNoValidadas.length} transacción(es) no validadas con forma de pago distinta a efectivo.`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const ingresos = await this.transaccionesRepository
      .createQueryBuilder('t')
      .leftJoin('t.UsuarioCreo', 'u')
      .where('t.TipoTransaccion = :tipo', { tipo: 'Ingreso' })
      .andWhere('u.UsuarioID = :usuarioID', { usuarioID })
      .andWhere('DATE(t.FechaTransaccion) >= :fecha', { fecha: fechaBusqueda })
      .getMany();

    const egresos = await this.transaccionesRepository
      .createQueryBuilder('t')
      .leftJoin('t.UsuarioCreo', 'u')
      .where('t.TipoTransaccion = :tipo', { tipo: 'Egreso' })
      .andWhere('u.UsuarioID = :usuarioID', { usuarioID })
      .andWhere('DATE(t.FechaTransaccion) >= :fecha', { fecha: fechaBusqueda })
      .getMany();

    const pagosPoliza = await this.pagosPolizaRepository
      .createQueryBuilder('p')
      .leftJoin('p.Usuario', 'u')
      .leftJoinAndSelect('p.MetodoPago', 'm')
      .where('p.MotivoCancelacion IS NULL')
      .andWhere('u.UsuarioID = :usuarioID', { usuarioID })
      .andWhere('DATE(p.FechaPago) >= :fecha', { fecha: fechaBusqueda })
      .getMany();

    console.log('📊 Resultados de consultas:', {
      ingresos: ingresos.length,
      egresos: egresos.length,
      pagosPoliza: pagosPoliza.length,
    });

    // 🔍 DEBUG DETALLADO DE INICIO DE CAJA
    console.log('💰 INICIO DE CAJA:', {
      MontoInicial: Number(inicioCaja.MontoInicial),
      TotalEfectivo: Number(inicioCaja.TotalEfectivo),
      TotalTransferencia: Number(inicioCaja.TotalTransferencia),
    });

    let totalIngresos = 0,
      totalEgresos = 0;
    let totalIngresosEfectivo = 0,
      totalIngresosTarjeta = 0,
      totalIngresosTransferencia = 0;
    let totalEgresosEfectivo = 0,
      totalEgresosTarjeta = 0,
      totalEgresosTransferencia = 0;

    // 🔍 DEBUG INGRESOS
    console.log('💵 INGRESOS:');
    ingresos.forEach((transaccion) => {
      const monto = Number(transaccion.Monto);
      totalIngresos += monto;

      console.log(`  ➕ ${transaccion.FormaPago}: $${monto} - ${transaccion.Descripcion}`);

      if (transaccion.FormaPago === 'Efectivo')
        totalIngresosEfectivo += monto;
      if (transaccion.FormaPago === 'Tarjeta')
        totalIngresosTarjeta += monto;
      if (
        transaccion.FormaPago === 'Transferencia' ||
        transaccion.FormaPago === 'Deposito'
      )
        totalIngresosTransferencia += monto;
    });

    console.log('📤 TOTALES INGRESOS:', {
      Total: totalIngresos,
      Efectivo: totalIngresosEfectivo,
      Tarjeta: totalIngresosTarjeta,
      Transferencia: totalIngresosTransferencia,
    });

    // 🔍 DEBUG EGRESOS
    console.log('💸 EGRESOS:');
    egresos.forEach((transaccion) => {
      const monto = Number(transaccion.Monto);
      totalEgresos += monto;

      console.log(`  ➖ ${transaccion.FormaPago}: $${monto} - ${transaccion.Descripcion}`);

      if (transaccion.FormaPago === 'Efectivo')
        totalEgresosEfectivo += monto;
      if (transaccion.FormaPago === 'Tarjeta')
        totalEgresosTarjeta += monto;
      if (
        transaccion.FormaPago === 'Transferencia' ||
        transaccion.FormaPago === 'Deposito'
      )
        totalEgresosTransferencia += monto;
    });

    console.log('📥 TOTALES EGRESOS:', {
      Total: totalEgresos,
      Efectivo: totalEgresosEfectivo,
      Tarjeta: totalEgresosTarjeta,
      Transferencia: totalEgresosTransferencia,
    });

    // 🔍 DEBUG PAGOS PÓLIZA
    console.log('📋 PAGOS PÓLIZA:');
    pagosPoliza.forEach((pago) => {
      const monto = Number(pago.MontoPagado);
      totalIngresos += monto;

      console.log(`  💳 Método ${pago.MetodoPago.IDMetodoPago} (${pago.MetodoPago?.NombreMetodo}): $${monto}`);

      if (pago.MetodoPago.IDMetodoPago === 3)
        totalIngresosEfectivo += monto;
      if (pago.MetodoPago.IDMetodoPago === 4)
        totalIngresosTarjeta += monto;
      if ([1, 2].includes(pago.MetodoPago.IDMetodoPago))
        totalIngresosTransferencia += monto;
    });

    console.log('📋 TOTALES DESPUÉS DE PAGOS PÓLIZA:', {
      TotalIngresos: totalIngresos,
      IngresosEfectivo: totalIngresosEfectivo,
      IngresosTarjeta: totalIngresosTarjeta,
      IngresosTransferencia: totalIngresosTransferencia,
    });

    // 🔍 DEBUG CÁLCULOS FINALES
    const totalEfectivo =
      Number(inicioCaja.TotalEfectivo) +
      totalIngresosEfectivo -
      totalEgresosEfectivo;

    // 💵 SOLO EFECTIVO: El saldo esperado debe ser solo efectivo físico
    // totalEfectivo ya incluye: inicioCaja.TotalEfectivo + ingresosEfectivo - egresosEfectivo
    // Tarjeta y transferencia se muestran informativamente pero NO se incluyen en el saldo esperado
    const saldoEsperado = totalEfectivo;

    const totalTransferencia =
      Number(inicioCaja.TotalTransferencia) +
      totalIngresosTransferencia -
      totalEgresosTransferencia;

    const totalPagoConTarjeta = totalIngresosTarjeta - totalEgresosTarjeta;

    console.log('🧮 CÁLCULO TOTAL EFECTIVO:', {
      InicioCajaTotalEfectivo: Number(inicioCaja.TotalEfectivo),
      MAS_IngresosEfectivo: totalIngresosEfectivo,
      MENOS_EgresosEfectivo: totalEgresosEfectivo,
      RESULTADO: totalEfectivo,
      FORMULA: `${Number(inicioCaja.TotalEfectivo)} + ${totalIngresosEfectivo} - ${totalEgresosEfectivo} = ${totalEfectivo}`
    });

    console.log('💰 TOTALES FINALES:', {
      SaldoEsperado: saldoEsperado,
      TotalEfectivo: totalEfectivo,
      TotalTransferencia: totalTransferencia,
      TotalPagoConTarjeta: totalPagoConTarjeta,
    });

    const pagosNoValidados = pagosPoliza.filter(
      (pago) => pago.MetodoPago.IDMetodoPago !== 3 && !pago.Validado,
    );

    if (pagosNoValidados.length > 0) {
      throw new HttpException(
        `SE REQUIERE VALIDAR ${pagosNoValidados.length} PAGOS QUE NO SE REALIZARON EN EFECTIVO`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const idsPolizas = pagosPoliza
      .map((p) => p.PolizaID)
      .filter((id) => id != null);

    const polizas = await this.polizaRepository.findBy({
      PolizaID: In(idsPolizas),
    });

    const polizasMap = new Map(polizas.map((p) => [p.PolizaID, p]));

    return {
      TotalIngresos: totalIngresos,
      TotalIngresosEfectivo: totalIngresosEfectivo,
      TotalIngresosTarjeta: totalIngresosTarjeta,
      TotalIngresosTransferencia: totalIngresosTransferencia,
      TotalEgresos: totalEgresos,
      TotalEgresosEfectivo: totalEgresosEfectivo,
      TotalEgresosTarjeta: totalEgresosTarjeta,
      TotalEgresosTransferencia: totalEgresosTransferencia,
      TotalEfectivo: totalEfectivo,
      TotalPagoConTarjeta: totalPagoConTarjeta,
      TotalTransferencia: totalTransferencia,
      SaldoEsperado: saldoEsperado,
      SaldoReal: 0,
      TotalEfectivoCapturado: 0,
      TotalTarjetaCapturado: 0,
      TotalTransferenciaCapturado: 0,
      Diferencia: 0,
      Observaciones: '',
      Estatus: 'Pendiente',
      DetalleIngresos: ingresos.map((t) => ({
        Monto: t.Monto,
        FormaPago: t.FormaPago,
        Fecha: t.FechaTransaccion,
        Descripcion: t.Descripcion,
      })),
      DetalleEgresos: egresos.map((t) => ({
        Monto: t.Monto,
        FormaPago: t.FormaPago,
        Fecha: t.FechaTransaccion,
        Descripcion: t.Descripcion,
      })),
      DetallePagosPoliza: pagosPoliza.map((p) => {
        const poliza = polizasMap.get(p.PolizaID);
        return {
          MontoPagado: p.MontoPagado,
          MetodoPago: p.MetodoPago?.NombreMetodo,
          FechaPago: p.FechaPago,
          Poliza: poliza
            ? {
              PolizaID: poliza.PolizaID,
              NumeroPoliza: poliza.NumeroPoliza,
            }
            : null,
        };
      }),
    };
  }


  async getCorteHistorialById(
    corteID: number,
  ): Promise<GenerateCorteUsuarioDto> {
    // 🔹 Buscar el corte de caja por ID
    const corte = await this.cortesUsuariosRepository.findOne({
      where: { CorteUsuarioID: corteID },
      relations: ['usuarioID', 'InicioCaja'], // Cargamos relaciones necesarias
    });

    if (!corte) {
      throw new HttpException(
        'Corte de caja no encontrado',
        HttpStatus.NOT_FOUND,
      );
    }

    // 🔹 Definir el rango de fecha basado en el `FechaCorte`
    const fechaInicio = new Date(corte.FechaCorte);
    fechaInicio.setHours(0, 0, 0, 0);
    const fechaFin = new Date(fechaInicio);
    fechaFin.setDate(fechaFin.getDate() + 1);

    console.log(`🔍 Buscando transacciones entre ${fechaInicio} y ${fechaFin}`);

    // 🔹 Obtener los ingresos del usuario en la fecha del corte
    const ingresos =
      (await this.transaccionesRepository.find({
        where: {
          TipoTransaccion: 'Ingreso',
          UsuarioCreo: { UsuarioID: corte.usuarioID.UsuarioID },
          FechaTransaccion: Between(fechaInicio, fechaFin),
        },
      })) || [];

    const egresos =
      (await this.transaccionesRepository.find({
        where: {
          TipoTransaccion: 'Egreso',
          UsuarioCreo: { UsuarioID: corte.usuarioID.UsuarioID },
          FechaTransaccion: Between(fechaInicio, fechaFin),
        },
      })) || [];

    // 🔹 Obtener pagos de póliza del usuario en la fecha del corte
    const pagosPoliza =
      (await this.pagosPolizaRepository.find({
        where: {
          MotivoCancelacion: null,
          Usuario: { UsuarioID: corte.usuarioID.UsuarioID },
          FechaPago: Between(fechaInicio, fechaFin),
        },
        relations: ['MetodoPago'],
      })) || [];

    let totalIngresos = 0,
      totalEgresos = 0;
    let totalIngresosEfectivo = 0,
      totalIngresosTarjeta = 0,
      totalIngresosTransferencia = 0;
    let totalEgresosEfectivo = 0,
      totalEgresosTarjeta = 0,
      totalEgresosTransferencia = 0;

    // 🔹 Calcular ingresos
    ingresos.forEach((transaccion) => {
      totalIngresos += Number(transaccion.Monto);
      if (transaccion.FormaPago === 'Efectivo')
        totalIngresosEfectivo += Number(transaccion.Monto);
      if (transaccion.FormaPago === 'Tarjeta')
        totalIngresosTarjeta += Number(transaccion.Monto);
      if (['Transferencia', 'Deposito'].includes(transaccion.FormaPago))
        totalIngresosTransferencia += Number(transaccion.Monto);
    });

    // 🔹 Calcular egresos
    egresos.forEach((transaccion) => {
      totalEgresos += Number(transaccion.Monto);
      if (transaccion.FormaPago === 'Efectivo')
        totalEgresosEfectivo += Number(transaccion.Monto);
      if (transaccion.FormaPago === 'Tarjeta')
        totalEgresosTarjeta += Number(transaccion.Monto);
      if (['Transferencia', 'Deposito'].includes(transaccion.FormaPago))
        totalEgresosTransferencia += Number(transaccion.Monto);
    });

    // 🔹 Calcular pagos de póliza
    pagosPoliza.forEach((pago) => {
      totalIngresos += Number(pago.MontoPagado);
      if (pago.MetodoPago.IDMetodoPago === 3)
        totalIngresosEfectivo += Number(pago.MontoPagado);
      if (pago.MetodoPago.IDMetodoPago === 4)
        totalIngresosTarjeta += Number(pago.MontoPagado);
      if ([1, 2].includes(pago.MetodoPago.IDMetodoPago))
        totalIngresosTransferencia += Number(pago.MontoPagado);
    });

    // 🔹 Correcciones de cálculos
    const totalEfectivo =
      Number(corte.InicioCaja?.TotalEfectivo || 0) +
      totalIngresosEfectivo -
      totalEgresosEfectivo;

    // 💵 SOLO EFECTIVO: El saldo esperado debe ser solo efectivo físico
    // totalEfectivo ya incluye: inicioCaja.TotalEfectivo + ingresosEfectivo - egresosEfectivo
    // Tarjeta y transferencia se muestran informativamente pero NO se incluyen en el saldo esperado
    const saldoEsperado = totalEfectivo;

    const totalTransferencia =
      Number(corte.InicioCaja?.TotalTransferencia || 0) +
      totalIngresosTransferencia -
      totalEgresosTransferencia;

    const totalPagoConTarjeta = totalIngresosTarjeta - totalEgresosTarjeta;

    const idsPolizas = pagosPoliza
      .map((p) => p.PolizaID)
      .filter((id) => id != null);

    const polizas = await this.polizaRepository.findBy({
      PolizaID: In(idsPolizas),
    });

    const polizasMap = new Map(polizas.map((p) => [p.PolizaID, p]));

    return {
      TotalIngresos: totalIngresos,
      TotalIngresosEfectivo: totalIngresosEfectivo,
      TotalIngresosTarjeta: totalIngresosTarjeta,
      TotalIngresosTransferencia: totalIngresosTransferencia,
      TotalEgresos: totalEgresos,
      TotalEgresosEfectivo: totalEgresosEfectivo,
      TotalEgresosTarjeta: totalEgresosTarjeta,
      TotalEgresosTransferencia: totalEgresosTransferencia,
      TotalEfectivo: totalEfectivo,
      TotalPagoConTarjeta: totalPagoConTarjeta,
      TotalTransferencia: totalTransferencia,
      SaldoEsperado: saldoEsperado,
      SaldoReal: corte.SaldoReal,
      TotalEfectivoCapturado: corte.TotalEfectivoCapturado,
      TotalTarjetaCapturado: corte.TotalTarjetaCapturado,
      TotalTransferenciaCapturado: corte.TotalTransferenciaCapturado,
      Diferencia: corte.Diferencia,
      Observaciones: corte.Observaciones,
      Estatus: corte.Estatus,

      // 🔹 **Desglose de Ingresos**
      DetalleIngresos: ingresos.map((t) => ({
        Monto: t.Monto,
        FormaPago: t.FormaPago,
        Fecha: t.FechaTransaccion,
        Descripcion: t.Descripcion,
      })),

      // 🔹 **Desglose de Egresos**
      DetalleEgresos: egresos.map((t) => ({
        Monto: t.Monto,
        FormaPago: t.FormaPago,
        Fecha: t.FechaTransaccion,
        Descripcion: t.Descripcion,
      })),
      // 🔹 **Desglose de Pagos de Póliza**
      DetallePagosPoliza: pagosPoliza.map((p) => {
        const poliza = polizasMap.get(p.PolizaID);
        return {
          MontoPagado: p.MontoPagado,
          MetodoPago: p.MetodoPago?.NombreMetodo,
          FechaPago: p.FechaPago,
          Poliza: poliza
            ? {
              PolizaID: poliza.PolizaID,
              NumeroPoliza: poliza.NumeroPoliza,
            }
            : null,
        };
      }),
    };
  }

  async guardarCorteCaja(
    usuarioID: number,
    saldoReal: number,
    totalEfectivoCapturado: number,
    totalTarjetaCapturado: number,
    totalTransferenciaCapturado: number,
    observaciones?: string,
  ): Promise<CortesUsuarios> {
    if (!usuarioID) {
      throw new HttpException(
        '⚠️ usuarioID es requerido',
        HttpStatus.BAD_REQUEST,
      );
    }

    // ✅ VALIDACIÓN 1: Montos capturados no pueden ser negativos
    if (
      totalEfectivoCapturado < 0 ||
      totalTarjetaCapturado < 0 ||
      totalTransferenciaCapturado < 0
    ) {
      throw new HttpException(
        'Los montos capturados no pueden ser negativos',
        HttpStatus.BAD_REQUEST,
      );
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const mañana = new Date();
    mañana.setHours(23, 59, 59, 999);

    const corteExistente = await this.cortesUsuariosRepository.findOne({
      where: {
        usuarioID: { UsuarioID: usuarioID },
        FechaCorte: Between(hoy, mañana),
        Estatus: Not('Cerrado'),
      },
      relations: ['usuarioID'],
    });

    console.log(corteExistente);

    if (corteExistente) {
      throw new HttpException(
        'Ya existe un corte de caja en curso para este usuario en el día actual. No se puede generar otro.',
        HttpStatus.BAD_REQUEST,
      );
    }

    // **Primero generamos el corte de caja automático (NO se toca la lógica)**
    const corteCalculado = await this.generarCorteCaja(usuarioID);

    // ✅ VALIDACIÓN 2: Efectivo esperado negativo (CRÍTICO)
    if (corteCalculado.TotalEfectivo < 0) {
      throw new HttpException(
        `❌ No se puede cerrar el corte: el efectivo esperado es negativo ($${corteCalculado.TotalEfectivo.toFixed(2)}). ` +
        `Los egresos en efectivo ($${corteCalculado.TotalEgresosEfectivo.toFixed(2)}) superan el efectivo disponible. ` +
        `Verifica los movimientos antes de cerrar.`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // ✅ VALIDACIÓN 3: Monto capturado vs esperado (con tolerancia)
    const tolerancia = 0.01; // 1% de tolerancia

    if (totalEfectivoCapturado > corteCalculado.TotalEfectivo * (1 + tolerancia) && corteCalculado.TotalEfectivo >= 0) {
      throw new HttpException(
        `⚠️ El efectivo capturado ($${totalEfectivoCapturado.toFixed(2)}) excede significativamente el esperado ($${corteCalculado.TotalEfectivo.toFixed(2)}). ` +
        `Verifica el monto ingresado.`,
        HttpStatus.BAD_REQUEST,
      );
    }

    if (totalTarjetaCapturado > corteCalculado.TotalPagoConTarjeta * (1 + tolerancia) && corteCalculado.TotalPagoConTarjeta > 0) {
      throw new HttpException(
        `⚠️ El monto de tarjeta capturado ($${totalTarjetaCapturado.toFixed(2)}) excede el esperado ($${corteCalculado.TotalPagoConTarjeta.toFixed(2)}). ` +
        `Verifica el monto ingresado.`,
        HttpStatus.BAD_REQUEST,
      );
    }

    if (totalTransferenciaCapturado > corteCalculado.TotalTransferencia * (1 + tolerancia) && corteCalculado.TotalTransferencia > 0) {
      throw new HttpException(
        `⚠️ Las transferencias capturadas ($${totalTransferenciaCapturado.toFixed(2)}) exceden las esperadas ($${corteCalculado.TotalTransferencia.toFixed(2)}). ` +
        `Verifica el monto ingresado.`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // **Obtener el inicio de caja activo del usuario**
    const inicioCaja = await this.iniciosCajaRepository.findOne({
      where: {
        Usuario: { UsuarioID: usuarioID },
        Estatus: 'Activo',
        FechaInicio: Between(hoy, new Date(hoy.getTime() + 86400000)),
      },
    });

    if (!inicioCaja) {
      throw new HttpException(
        'No se encontró un inicio de caja activo para este usuario en el día actual',
        HttpStatus.NOT_FOUND,
      );
    }

    const transaccionesSinCaja = await this.transaccionesRepository.find({
      where: {
        UsuarioCreo: { UsuarioID: usuarioID },
        InicioCaja: IsNull(),
      },
    });

    console.log(
      '🔍 Transacciones encontradas con find():',
      transaccionesSinCaja,
    );

    if (transaccionesSinCaja.length > 0) {
      console.log('en el if');
      for (const transaccion of transaccionesSinCaja) {
        transaccion.InicioCaja = inicioCaja;
      }
      await this.transaccionesRepository.save(transaccionesSinCaja);
    }

    // 💵 DIFERENCIA SOLO DE EFECTIVO: Comparar efectivo real vs efectivo esperado
    // (antes comparaba suma total vs efectivo esperado, lo cual estaba incorrecto)
    // ✅ CORRECCIÓN P7: Redondear diferencia a 2 decimales para evitar problemas de precisión
    const diferencia = Number((totalEfectivoCapturado - corteCalculado.SaldoEsperado).toFixed(2));

    // ✅ VALIDACIÓN 4: Advertencia de diferencia significativa
    if (Math.abs(diferencia) > 0.01) { // Tolerancia de 1 centavo por redondeo
      // 🔴 CUALQUIER diferencia requiere observaciones
      if (!observaciones || observaciones.trim().length === 0) {
        throw new HttpException(
          `❌ Se requiere una observación cuando existe diferencia entre efectivo esperado y real. ` +
          `Efectivo esperado: $${corteCalculado.SaldoEsperado.toFixed(2)}, ` +
          `Efectivo capturado: $${totalEfectivoCapturado.toFixed(2)}, ` +
          `Diferencia: $${diferencia.toFixed(2)}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      // Si la diferencia es > 10%, requiere observación MÁS DETALLADA
      if (corteCalculado.SaldoEsperado !== 0) {
        const porcentajeDiferencia = (Math.abs(diferencia) / Math.abs(corteCalculado.SaldoEsperado)) * 100;

        if (porcentajeDiferencia > 10) {
          console.warn(
            `⚠️ ADVERTENCIA CRÍTICA: Diferencia del ${porcentajeDiferencia.toFixed(2)}% detectada. ` +
            `Efectivo esperado: $${corteCalculado.SaldoEsperado.toFixed(2)}, Efectivo capturado: $${totalEfectivoCapturado.toFixed(2)}, ` +
            `Diferencia: $${diferencia.toFixed(2)}`
          );

          // Diferencias grandes requieren observación más detallada
          if (observaciones.trim().length < 10) {
            throw new HttpException(
              `⚠️ Se requiere una observación DETALLADA (mínimo 10 caracteres) cuando la diferencia supera el 10%. ` +
              `Diferencia actual: $${diferencia.toFixed(2)} (${porcentajeDiferencia.toFixed(2)}%)`,
              HttpStatus.BAD_REQUEST,
            );
          }
        }
      }
    }

    // ✅ VALIDACIÓN 5: Saldo real debe coincidir con suma de capturados
    const sumaCapturados = totalEfectivoCapturado + totalTarjetaCapturado + totalTransferenciaCapturado;
    const diferenciaCaptura = Math.abs(saldoReal - sumaCapturados);

    if (diferenciaCaptura > 0.01) { // Tolerancia de 1 centavo por redondeo
      throw new HttpException(
        `❌ Inconsistencia: El saldo real ($${saldoReal.toFixed(2)}) no coincide con la suma de montos capturados ($${sumaCapturados.toFixed(2)}). ` +
        `Diferencia: $${diferenciaCaptura.toFixed(2)}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const usuario = await this.usersRepository.findOne({
      where: { UsuarioID: usuarioID },
    });
    console.log('🔍 Usuario encontrado con QueryBuilder:', usuario);

    if (!usuario) {
      throw new HttpException('El usuario no existe.', HttpStatus.BAD_REQUEST);
    }

    const sucursal = await this.sucursalRepository.findOne({
      where: { SucursalID: usuario.SucursalID },
    });

    if (!sucursal) {
      throw new HttpException(
        'El usuario no tiene una sucursal asignada.',
        HttpStatus.BAD_REQUEST,
      );
    }

    // ✅ VALIDACIÓN 6: Verificar que no haya transacciones no validadas
    const transaccionesNoValidadas = await this.transaccionesRepository
      .createQueryBuilder('t')
      .leftJoin('t.UsuarioCreo', 'u')
      .where('u.UsuarioID = :usuarioID', { usuarioID })
      .andWhere('DATE(t.FechaTransaccion) >= :fechaInicio', {
        fechaInicio: hoy.toISOString().split('T')[0]
      })
      .andWhere('t.FormaPago IN (:...formasPago)', {
        formasPago: ['Transferencia', 'Deposito', 'Tarjeta']
      })
      .andWhere('t.Validado = :validado', { validado: false })
      .getCount();

    if (transaccionesNoValidadas > 0) {
      throw new HttpException(
        `❌ No se puede cerrar el corte: existen ${transaccionesNoValidadas} transacción(es) no validadas. ` +
        `Todas las transacciones electrónicas deben estar validadas antes de cerrar.`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // **Guardar el corte en la base de datos**
    const nuevoCorte = this.cortesUsuariosRepository.create({
      InicioCaja: inicioCaja,
      usuarioID: usuario,
      Sucursal: sucursal,
      FechaCorte: new Date(),
      TotalIngresos: corteCalculado.TotalIngresos,
      TotalIngresosEfectivo: corteCalculado.TotalIngresosEfectivo,
      TotalIngresosTarjeta: corteCalculado.TotalIngresosTarjeta,
      TotalIngresosTransferencia: corteCalculado.TotalIngresosTransferencia,
      TotalEgresos: corteCalculado.TotalEgresos,
      TotalEgresosEfectivo: corteCalculado.TotalEgresosEfectivo,
      TotalEgresosTarjeta: corteCalculado.TotalEgresosTarjeta,
      TotalEgresosTransferencia: corteCalculado.TotalEgresosTransferencia,
      TotalEfectivo: corteCalculado.TotalEfectivo,
      TotalPagoConTarjeta: corteCalculado.TotalPagoConTarjeta,
      TotalTransferencia: corteCalculado.TotalTransferencia,
      SaldoEsperado: corteCalculado.SaldoEsperado,
      SaldoReal: saldoReal,
      TotalEfectivoCapturado: totalEfectivoCapturado,
      TotalTarjetaCapturado: totalTarjetaCapturado,
      TotalTransferenciaCapturado: totalTransferenciaCapturado,
      Diferencia: diferencia,
      Observaciones: observaciones || '',
      Estatus: 'Cerrado',
    });

    const corteGuardado = await this.cortesUsuariosRepository.save(nuevoCorte);

    // **Actualizar el inicio de caja para marcarlo como "Cerrado"**
    //inicioCaja.Estatus = 'Cerrado';
    //await this.iniciosCajaRepository.save(inicioCaja);

    // 🔗 Amarrar Transacciones y PagosPoliza a este corte
    const transaccionesDelCorte = await this.transaccionesRepository.find({
      where: {
        UsuarioCreo: { UsuarioID: usuarioID },
        FechaTransaccion: Between(hoy, mañana),
      },
    });

    for (const t of transaccionesDelCorte) {
      (t as any).CorteUsuario = corteGuardado;
    }
    if (transaccionesDelCorte.length > 0) {
      await this.transaccionesRepository.save(transaccionesDelCorte);
    }

    const pagosPolizaDelCorte = await this.pagosPolizaRepository.find({
      where: {
        Usuario: { UsuarioID: usuarioID },
        FechaPago: Between(hoy, mañana),
        MotivoCancelacion: null,
      },
    });

    for (const p of pagosPolizaDelCorte) {
      (p as any).CorteUsuario = corteGuardado;
    }
    if (pagosPolizaDelCorte.length > 0) {
      await this.pagosPolizaRepository.save(pagosPolizaDelCorte);
    }

    return corteGuardado;
  }

}
