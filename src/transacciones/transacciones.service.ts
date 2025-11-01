import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transacciones } from './entities/transacciones.entity';
import { CreateTransaccionDto } from './dto/create-transaccion.dto';
import { UpdateTransaccionDto } from './dto/update-transaccion.dto';
import { IniciosCaja } from 'src/inicios-caja/entities/inicios-caja.entity';
import { usuarios } from 'src/users/users.entity';
import { CuentasBancarias } from 'src/cuentas-bancarias/entities/cuentas-bancarias.entity';
import { BitacoraEliminacionesService } from 'src/bitacora-eliminaciones/bitacora-eliminaciones.service';
import { BitacoraEdicionesService } from 'src/bitacora-ediciones/bitacora-ediciones.service';

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

  async create(createDto: CreateTransaccionDto): Promise<Transacciones> {
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

    // Validar que el monto sea positivo
    if (Monto <= 0) {
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
    const usuarioCreo = await this.usuariosRepository.findOne({
      where: { UsuarioID: UsuarioCreoID },
    });
    if (!usuarioCreo) {
      throw new HttpException(
        'Usuario que creó la transacción no encontrado',
        HttpStatus.NOT_FOUND,
      );
    }

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

    // Validar CuentaBancaria
    let cuentaBancaria = null;
    if (CuentaBancariaID) {
      cuentaBancaria = await this.cuentasBancariasRepository.findOne({
        where: { CuentaBancariaID },
      });
      if (!cuentaBancaria) {
        throw new HttpException(
          'Cuenta bancaria no encontrada',
          HttpStatus.NOT_FOUND,
        );
      }
    }

    // Crear transacción
    const nuevaTransaccion = this.transaccionesRepository.create({
      TipoTransaccion,
      FormaPago,
      Monto,
      //InicioCaja: inicioCaja,
      UsuarioCreo: usuarioCreo,
      UsuarioValido: usuarioValido,
      CuentaBancaria: cuentaBancaria,
      Descripcion,
      Validado: Validado ? true : false, // Aseguramos que sea booleano
    });

    return this.transaccionesRepository.save(nuevaTransaccion);
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
