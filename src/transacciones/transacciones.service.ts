import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan } from 'typeorm';
import { Transacciones } from './entities/transacciones.entity';
import { CreateTransaccionDto } from './dto/create-transaccion.dto';
import { UpdateTransaccionDto } from './dto/update-transaccion.dto';
import { IniciosCaja } from 'src/inicios-caja/entities/inicios-caja.entity';
import { usuarios } from 'src/users/users.entity';
import { CuentasBancarias } from 'src/cuentas-bancarias/entities/cuentas-bancarias.entity';
import { BitacoraEliminacionesService } from 'src/bitacora-eliminaciones/bitacora-eliminaciones.service';
import { BitacoraEdicionesService } from 'src/bitacora-ediciones/bitacora-ediciones.service';
import { CajaChica } from 'src/caja-chica/entities/caja-chica.entity';
import { CajaGeneral } from 'src/caja-general/entities/caja-general.entity';
import { CortesUsuarios } from 'src/corte-caja/entities/cortes-usuarios.entity';

@Injectable()
export class TransaccionesService {
  private authorizationCodes: Map<number, string> = new Map(); // Almacén temporal de códigos de autorización

  constructor(
    @InjectRepository(Transacciones, 'db1')
    private readonly transaccionesRepository: Repository<Transacciones>,

    @InjectRepository(IniciosCaja, 'db1')
    private readonly iniciosCajaRepository: Repository<IniciosCaja>,

    @InjectRepository(usuarios, 'db1')
    private readonly usuariosRepository: Repository<usuarios>,

    @InjectRepository(CuentasBancarias, 'db1')
    private readonly cuentasBancariasRepository: Repository<CuentasBancarias>,

    @InjectRepository(CajaChica, 'db1')
    private readonly cajaChicaRepository: Repository<CajaChica>,

    @InjectRepository(CajaGeneral, 'db1')
    private readonly cajaGeneralRepository: Repository<CajaGeneral>,

    @InjectRepository(CortesUsuarios, 'db1')
    private readonly cortesUsuariosRepository: Repository<CortesUsuarios>,

    private readonly bitacoraEliminacionesService: BitacoraEliminacionesService,
    private readonly bitacoraEdicionesService: BitacoraEdicionesService,
  ) { }

  // ✅ Servicio: transacciones.service.ts
  async generarCodigoAutorizacion(
    id: number,
  ): Promise<{ id: number; codigo: string }> {
    const codigo = Math.random().toString(36).substr(2, 6).toUpperCase();
    this.authorizationCodes.set(id, codigo);
    return { id, codigo };
  }

  // ✅ Método para validar el código de autorización
  private validarCodigoAutorizacion(id: number, codigo: string): void {
    const codigoAlmacenado = this.authorizationCodes.get(id);
    if (!codigoAlmacenado || codigoAlmacenado !== codigo) {
      throw new HttpException(
        'Código de autorización inválido o expirado',
        HttpStatus.UNAUTHORIZED,
      );
    }

    // ✅ Eliminar el código después de usarlo para evitar reutilización
    this.authorizationCodes.delete(id);
  }

  // ═══════════════════════════════════════════════════════════════
  // 🔒 FASE 3: VALIDAR INMUTABILIDAD DE TRANSACCIONES
  // ═══════════════════════════════════════════════════════════════
  /**
   * Valida que una transacción NO esté bloqueada para edición/eliminación
   *
   * JERARQUÍA DE BLOQUEOS:
   * 1. Corte de usuario → Bloquea movimientos de ESE usuario antes del corte
   * 2. Caja chica cerrada → Bloquea movimientos de TODOS los usuarios
   * 3. Caja general cerrada → Bloquea TODO el sistema
   *
   * @param transaccionId - ID de la transacción a validar
   * @throws HttpException si la transacción está bloqueada
   */
  private async validarInmutabilidad(transaccionId: number): Promise<void> {
    console.log('🔍 ===== VALIDANDO INMUTABILIDAD DE TRANSACCIÓN =====');
    console.log(`   Transacción ID: ${transaccionId}`);

    // Obtener la transacción con usuario
    const transaccion = await this.transaccionesRepository.findOne({
      where: { TransaccionID: transaccionId },
      relations: ['UsuarioCreo'],
    });

    if (!transaccion) {
      throw new HttpException('Transacción no encontrada', HttpStatus.NOT_FOUND);
    }

    console.log(`   Fecha transacción: ${transaccion.FechaTransaccion.toISOString()}`);
    console.log(`   Usuario: ${transaccion.UsuarioCreo.NombreUsuario} (ID: ${transaccion.UsuarioCreo.UsuarioID})`);
    console.log(`   Sucursal: ${transaccion.UsuarioCreo.SucursalID}`);

    // ─────────────────────────────────────────────────────────────────
    // ❌ VALIDACIÓN 1: NO EDITAR DESPUÉS DE CORTE DE USUARIO
    // ─────────────────────────────────────────────────────────────────
    // REGLA: "Al usuario se le debe de hacer el corte del día de usuario,
    // y a partir de ahí ya no debe poder eliminar editar ni borrar ningún
    // movimiento anterior al corte."
    // ─────────────────────────────────────────────────────────────────

    const cortePosterior = await this.cortesUsuariosRepository.findOne({
      where: {
        usuarioID: { UsuarioID: transaccion.UsuarioCreo.UsuarioID },
        FechaCorte: MoreThan(transaccion.FechaTransaccion),
        Estatus: 'Cerrado',
      },
      order: { FechaCorte: 'ASC' },
    });

    if (cortePosterior) {
      const fechaCorteStr = cortePosterior.FechaCorte.toISOString().split('T')[0];
      console.log(`   ❌ BLOQUEADO: Existe corte cerrado posterior (${fechaCorteStr})`);

      throw new HttpException(
        `❌ No se puede modificar esta transacción: el usuario ya tiene un corte cerrado ` +
        `(${fechaCorteStr}) posterior a la fecha del movimiento. ` +
        `Los movimientos anteriores a un corte son inmutables.`,
        HttpStatus.BAD_REQUEST,
      );
    }

    console.log(`   ✅ Sin cortes posteriores del usuario`);

    // ─────────────────────────────────────────────────────────────────
    // ❌ VALIDACIÓN 2: NO EDITAR DESPUÉS DE CAJA CHICA
    // ─────────────────────────────────────────────────────────────────
    // REGLA: "Si se quiere hacer algún movimiento de edición borrado
    // o ingresar X cosa, se debe de eliminar el cuadre de caja chica,
    // se hace el movimiento que se desea, y se vuelve a cuadrar caja chica."
    // ─────────────────────────────────────────────────────────────────

    // Obtener fecha de la transacción (día completo)
    const fechaTransaccion = new Date(transaccion.FechaTransaccion);
    fechaTransaccion.setHours(0, 0, 0, 0);
    const finDiaTransaccion = new Date(fechaTransaccion);
    finDiaTransaccion.setHours(23, 59, 59, 999);

    console.log(`   Validando cuadres para: ${fechaTransaccion.toISOString().split('T')[0]}`);

    const cajaChicaCerrada = await this.cajaChicaRepository.findOne({
      where: {
        Fecha: Between(fechaTransaccion, finDiaTransaccion),
        Estatus: 'Cerrado',
        Sucursal: { SucursalID: transaccion.UsuarioCreo.SucursalID },
      },
    });

    if (cajaChicaCerrada) {
      const fechaCuadreStr = fechaTransaccion.toISOString().split('T')[0];
      console.log(`   ❌ BLOQUEADO: Existe cuadre de caja chica cerrado para ${fechaCuadreStr}`);

      throw new HttpException(
        `❌ No se puede modificar esta transacción: existe un cuadre de caja chica cerrado ` +
        `para la fecha ${fechaCuadreStr}. ` +
        `Debe eliminar el cuadre de caja chica primero si necesita hacer cambios.`,
        HttpStatus.BAD_REQUEST,
      );
    }

    console.log(`   ✅ Sin cuadre de caja chica cerrado`);

    // ─────────────────────────────────────────────────────────────────
    // ❌ VALIDACIÓN 3: NO EDITAR DESPUÉS DE CAJA GENERAL
    // ─────────────────────────────────────────────────────────────────
    // REGLA: "El cuadre de caja general bloquea todo el sistema de
    // cualquier tipo de edición borrado etc."
    // ─────────────────────────────────────────────────────────────────

    const cajaGeneralCerrada = await this.cajaGeneralRepository.findOne({
      where: {
        Fecha: Between(fechaTransaccion, finDiaTransaccion),
        Estatus: 'Cerrado',
        ...(transaccion.UsuarioCreo.SucursalID && {
          Sucursal: { SucursalID: transaccion.UsuarioCreo.SucursalID },
        }),
      },
    });

    if (cajaGeneralCerrada) {
      const fechaCuadreStr = fechaTransaccion.toISOString().split('T')[0];
      console.log(`   ❌ BLOQUEADO: Existe cuadre de caja general cerrado para ${fechaCuadreStr}`);

      throw new HttpException(
        `❌ No se puede modificar esta transacción: existe un cuadre de caja general cerrado ` +
        `para la fecha ${fechaCuadreStr}. ` +
        `El sistema está completamente cerrado para esa fecha. No se permiten modificaciones.`,
        HttpStatus.BAD_REQUEST,
      );
    }

    console.log(`   ✅ Sin cuadre de caja general cerrado`);
    console.log(`   ✅ VALIDACIÓN EXITOSA: Transacción puede ser modificada`);
  }

  // ═══════════════════════════════════════════════════════════════
  // FIN DE VALIDACIONES DE INMUTABILIDAD
  // ═══════════════════════════════════════════════════════════════

  async create(createDto: CreateTransaccionDto): Promise<Transacciones> {
    console.log('🔄 TransaccionesService.create() - Iniciando...');
    console.log('   DTO recibido:', JSON.stringify(createDto, null, 2));

    const {
      TipoTransaccion,
      FormaPago,
      Monto,
      UsuarioCreoID,
      UsuarioValidoID,
      CuentaBancariaID,
      Descripcion,
      Validado,
    } = createDto;

    // ═══════════════════════════════════════════════════════════════
    // VALIDACIONES DE CAMPOS REQUERIDOS
    // ═══════════════════════════════════════════════════════════════

    if (!TipoTransaccion) {
      throw new HttpException(
        'El campo TipoTransaccion es obligatorio',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!FormaPago) {
      throw new HttpException(
        'El campo FormaPago es obligatorio',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!UsuarioCreoID) {
      throw new HttpException(
        'El campo UsuarioCreoID es obligatorio',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validar que el monto sea positivo
    if (Monto === undefined || Monto === null || Monto <= 0) {
      throw new HttpException(
        'El monto debe ser mayor a 0',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Buscar el InicioCaja activo para el UsuarioCreoID
    /*const inicioCaja = await this.iniciosCajaRepository.findOne({
      where: { Usuario: { UsuarioID: UsuarioCreoID }, Estatus: 'Activo' },
    });

    if (!inicioCaja) {
      throw new HttpException(
        'No se encontró un Inicio de Caja activo para el usuario que creó la transacción',
        HttpStatus.NOT_FOUND,
      );
    }*/

    // Validar UsuarioCreo
    console.log('   Buscando usuario con ID:', UsuarioCreoID);
    const usuarioCreo = await this.usuariosRepository.findOne({
      where: { UsuarioID: UsuarioCreoID },
    });
    if (!usuarioCreo) {
      throw new HttpException(
        `Usuario con ID ${UsuarioCreoID} no encontrado`,
        HttpStatus.NOT_FOUND,
      );
    }
    console.log('   ✅ Usuario encontrado:', usuarioCreo.NombreUsuario, '- SucursalID:', usuarioCreo.SucursalID);

    // Validar que el usuario tenga sucursal asignada
    if (!usuarioCreo.SucursalID) {
      throw new HttpException(
        `El usuario ${usuarioCreo.NombreUsuario} no tiene una sucursal asignada. Contacte al administrador.`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // ═══════════════════════════════════════════════════════════════
    // 🔒 FASE 2: VALIDACIONES DE BLOQUEO POR CUADRES
    // ═══════════════════════════════════════════════════════════════

    console.log('🔍 Validando permisos para crear transacción...');
    console.log(`   Usuario: ${usuarioCreo.NombreUsuario} (ID: ${usuarioCreo.UsuarioID})`);
    console.log(`   Sucursal: ${usuarioCreo.SucursalID}`);
    console.log(`   Es Caja General: ${createDto.EsGeneral ? 'SÍ' : 'NO'}`);

    // 🌍 Rango del día actual en hora local (America/Mexico_City)
    // IMPORTANTE: Debe ser consistente con caja-chica y caja-general
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const finDia = new Date();
    finDia.setHours(23, 59, 59, 999);

    console.log(`   Rango búsqueda: ${hoy.toISOString()} → ${finDia.toISOString()}`);

    // ─────────────────────────────────────────────────────────────────
    // ❌ VALIDACIÓN 1: BLOQUEAR MOVIMIENTOS DESPUÉS DE CAJA CHICA
    // ─────────────────────────────────────────────────────────────────
    // REGLA: "Realizado el cuadre de caja chica, ningún usuario debe
    // de poder hacer movimientos como cobros abonos egresos ingresos etc."
    //
    // EXCEPCIÓN: "En caja general existen diversos ingresos o egresos,
    // estos no se encuentran bloqueados, aún y que se hayan realizado
    // el corte de usuario, o cuadre caja chica"
    // ─────────────────────────────────────────────────────────────────

    const cajaChicaCerrada = await this.cajaChicaRepository.count({
      where: {
        Fecha: Between(hoy, finDia), // ✅ CORRECCIÓN: Usar Fecha (día del cuadre), no FechaCierre
        Estatus: 'Cerrado',
        Sucursal: { SucursalID: usuarioCreo.SucursalID },
      },
    });

    console.log(`   Caja Chica cerrada hoy: ${cajaChicaCerrada > 0 ? 'SÍ' : 'NO'}`);

    if (cajaChicaCerrada > 0) {
      // EXCEPCIÓN: Permitir si es movimiento de caja general
      const esCajaGeneral = createDto.EsGeneral === true;

      if (!esCajaGeneral) {
        console.log('   ❌ BLOQUEADO: Caja Chica cerrada y NO es movimiento de Caja General');
        throw new HttpException(
          '❌ No se pueden realizar movimientos: la Caja Chica ya ha sido cuadrada para hoy en esta sucursal. ' +
          'Solo se permiten movimientos de Caja General.',
          HttpStatus.BAD_REQUEST,
        );
      }

      console.log('   ✅ PERMITIDO: Es movimiento de Caja General (excepción aplicada)');
    }

    // ─────────────────────────────────────────────────────────────────
    // ❌ VALIDACIÓN 2: BLOQUEAR TODO DESPUÉS DE CAJA GENERAL
    // ─────────────────────────────────────────────────────────────────
    // REGLA: "Si se realiza el cuadre de caja general ya nadie puede
    // hacer movimientos en la sucursal en que se cuadró la caja general."
    //
    // NINGUNA EXCEPCIÓN: Ni siquiera movimientos de Caja General
    // ─────────────────────────────────────────────────────────────────

    const cajaGeneralCerrada = await this.cajaGeneralRepository.count({
      where: {
        Fecha: Between(hoy, finDia),
        Estatus: 'Cerrado',
        ...(usuarioCreo.SucursalID && {
          Sucursal: { SucursalID: usuarioCreo.SucursalID }
        }),
      },
    });

    console.log(`   Caja General cerrada hoy: ${cajaGeneralCerrada > 0 ? 'SÍ' : 'NO'}`);

    if (cajaGeneralCerrada > 0) {
      console.log('   ❌ BLOQUEADO: Caja General cerrada - sistema cerrado');
      throw new HttpException(
        '❌ No se pueden realizar movimientos: la Caja General ya ha sido cuadrada para hoy en esta sucursal. ' +
        'El sistema está cerrado para movimientos.',
        HttpStatus.BAD_REQUEST,
      );
    }

    console.log('   ✅ Validaciones pasadas - se puede crear la transacción');

    // ═══════════════════════════════════════════════════════════════
    // FIN DE VALIDACIONES DE BLOQUEO
    // ═══════════════════════════════════════════════════════════════

    // Validar UsuarioValido
    let usuarioValido = null;
    if (UsuarioValidoID) {
      usuarioValido = await this.usuariosRepository.findOne({
        where: { UsuarioID: UsuarioValidoID },
      });
      if (!usuarioValido) {
        throw new HttpException(
          'Usuario que validó la transacción no encontrado',
          HttpStatus.NOT_FOUND,
        );
      }
    }

    // Validar CuentaBancaria (0 o null/undefined = sin cuenta bancaria)
    let cuentaBancaria = null;
    // CuentaBancariaID = 0 se trata como "sin cuenta bancaria"
    if (CuentaBancariaID && CuentaBancariaID > 0) {
      console.log('   Buscando cuenta bancaria con ID:', CuentaBancariaID);
      cuentaBancaria = await this.cuentasBancariasRepository.findOne({
        where: { CuentaBancariaID },
      });
      if (!cuentaBancaria) {
        throw new HttpException(
          `Cuenta bancaria con ID ${CuentaBancariaID} no encontrada`,
          HttpStatus.NOT_FOUND,
        );
      }
      console.log('   ✅ Cuenta bancaria encontrada');
    } else {
      console.log('   ℹ️ Sin cuenta bancaria (CuentaBancariaID:', CuentaBancariaID, ')');
    }

    // Crear transacción
    console.log('   📝 Creando entidad de transacción...');
    const nuevaTransaccion = this.transaccionesRepository.create({
      TipoTransaccion,
      FormaPago,
      Monto,
      EsGeneral: createDto.EsGeneral ?? false, // 🔹 FASE 2: Campo para distinguir Caja General
      //InicioCaja: inicioCaja,
      UsuarioCreo: usuarioCreo,
      UsuarioValido: usuarioValido,
      CuentaBancaria: cuentaBancaria,
      Descripcion,
      Validado: Validado ? true : false, // Aseguramos que sea booleano
    });

    try {
      console.log('   💾 Guardando transacción en base de datos...');
      const saved = await this.transaccionesRepository.save(nuevaTransaccion);
      console.log('   ✅ Transacción guardada con ID:', saved.TransaccionID);
      return saved;
    } catch (dbError) {
      console.error('   ❌ Error de base de datos al guardar transacción:', {
        message: dbError.message,
        code: dbError.code,
        sqlMessage: dbError.sqlMessage,
      });
      throw new HttpException(
        `Error al guardar transacción: ${dbError.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAll(): Promise<Transacciones[]> {
    return this.transaccionesRepository.find({
      relations: [
        'InicioCaja',
        'UsuarioCreo',
        'UsuarioValido',
        'CuentaBancaria',
      ],
    });
  }

  async findOne(id: number): Promise<Transacciones> {
    const transaccion = await this.transaccionesRepository.findOne({
      where: { TransaccionID: id },
      relations: [
        'InicioCaja',
        'UsuarioCreo',
        'UsuarioValido',
        'CuentaBancaria',
      ],
    });
    if (!transaccion) {
      throw new HttpException(
        'Transacción no encontrada',
        HttpStatus.NOT_FOUND,
      );
    }
    return transaccion;
  }

  async findByUserId(usuarioID: number): Promise<Transacciones[]> {
    const transacciones = await this.transaccionesRepository.find({
      where: { UsuarioCreo: { UsuarioID: usuarioID } },
      relations: [
        'InicioCaja',
        'UsuarioCreo',
        'UsuarioValido',
        'CuentaBancaria',
      ],
    });

    if (!transacciones.length) {
      throw new HttpException(
        `No se encontraron transacciones para el usuario con ID ${usuarioID}`,
        HttpStatus.NOT_FOUND,
      );
    }

    return transacciones;
  }

  // ✅ Método para actualizar una transacción con registro en bitácora
  async update(
    id: number,
    updateDto: UpdateTransaccionDto,
    usuario: string,
  ): Promise<Transacciones> {
    if (!usuario) {
      throw new HttpException(
        'El usuario de edición es obligatorio',
        HttpStatus.BAD_REQUEST,
      );
    }

    // 🔒 FASE 3: VALIDAR INMUTABILIDAD
    await this.validarInmutabilidad(id);

    const transaccion = await this.transaccionesRepository.findOne({
      where: { TransaccionID: id },
    });

    if (!transaccion) {
      throw new HttpException(
        'Transacción no encontrada',
        HttpStatus.NOT_FOUND,
      );
    }

    // 🧩 Extraer valores
    const { Validado, UsuarioValidoID } = updateDto as any;

    // 🔄 Convertir Validado a booleano para la comparación lógica
    const validadoBool = Validado === 1 || Validado === true;

    // 🔒 Validaciones cruzadas
    if (Validado !== undefined) {
      // Si se quiere marcar como validado (1 o true), debe existir usuario validador
      if (validadoBool && !UsuarioValidoID) {
        throw new HttpException(
          'Debe especificarse el UsuarioValidoID cuando se valida una transacción.',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Si se envía UsuarioValidoID pero Validado no es 1
      if (UsuarioValidoID && !validadoBool) {
        throw new HttpException(
          'Si se indica un UsuarioValidoID, el campo Validado debe ser 1 (true).',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    // 🧾 Registrar cambios
    const camposModificados = {};
    for (const [key, value] of Object.entries(updateDto)) {
      if (transaccion[key] !== value) {
        camposModificados[key] = { anterior: transaccion[key], nuevo: value };
      }
    }

    Object.assign(transaccion, updateDto);

    const updatedTransaccion =
      await this.transaccionesRepository.save(transaccion);

    // 🕵️‍♀️ Bitácora de ediciones
    if (Object.keys(camposModificados).length > 0) {
      await this.bitacoraEdicionesService.registrarEdicion(
        'Transacciones',
        id,
        camposModificados,
        usuario,
      );
    }

    return updatedTransaccion;
  }


  // ✅ Método para eliminar una transacción con validación de código
  // ✅ Método para eliminar una transacción con validación de código
  async remove(
    id: number,
    usuario: string,
    motivo: string,
    codigo: string,
  ): Promise<string> {
    if (!usuario) {
      throw new HttpException(
        'El usuario de eliminación es obligatorio',
        HttpStatus.BAD_REQUEST,
      );
    }

    // ✅ Validar el código de autorización
    this.validarCodigoAutorizacion(id, codigo);

    // 🔒 FASE 3: VALIDAR INMUTABILIDAD
    await this.validarInmutabilidad(id);

    const transaccion = await this.findOne(id);
    if (!transaccion) {
      throw new HttpException(
        'Transacción no encontrada',
        HttpStatus.NOT_FOUND,
      );
    }

    await this.transaccionesRepository.remove(transaccion);

    // ✅ Registrar en la bitácora de eliminaciones
    await this.bitacoraEliminacionesService.registrarEliminacion(
      'Transacciones',
      id,
      usuario,
      motivo,
    );

    return `Transacción con ID ${id} eliminada exitosamente.`;
  }

  // ✅ pon el tipo inline en baseQuery y en los métodos públicos:
  private baseQuery(
    validado: boolean,
    filtros: { fechaInicio?: string; fechaFin?: string; usuarioID?: number } = {},
  ) {
    const qb = this.transaccionesRepository
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.InicioCaja', 'inicio')
      .leftJoinAndSelect('t.UsuarioCreo', 'creo')
      .leftJoinAndSelect('t.UsuarioValido', 'valido')
      .leftJoinAndSelect('t.CuentaBancaria', 'cuenta')
      .where('t.FormaPago != :efectivo', { efectivo: 'Efectivo' })
      .andWhere('t.Validado = :validado', { validado });

    if (filtros.fechaInicio) {
      qb.andWhere('t.FechaTransaccion >= :fi', { fi: `${filtros.fechaInicio} 00:00:00` });
    }
    if (filtros.fechaFin) {
      qb.andWhere('t.FechaTransaccion <= :ff', { ff: `${filtros.fechaFin} 23:59:59` });
    }
    if (filtros.usuarioID) {
      qb.andWhere('creo.UsuarioID = :usuarioID', { usuarioID: filtros.usuarioID });
    }

    return qb.orderBy('t.FechaTransaccion', 'DESC');
  }

  async listarMovimientosPendientes(
    filtros: { fechaInicio?: string; fechaFin?: string; usuarioID?: number } = {},
  ) {
    return this.baseQuery(false, filtros).getMany();
  }

  async listarMovimientosValidados(
    filtros: { fechaInicio?: string; fechaFin?: string; usuarioID?: number } = {},
  ) {
    return this.baseQuery(true, filtros).getMany();
  }
}
