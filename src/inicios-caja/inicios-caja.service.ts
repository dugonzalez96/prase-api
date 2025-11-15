import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, LessThan, Repository } from 'typeorm';
import { IniciosCaja } from './entities/inicios-caja.entity';
import { CreateInicioCajaDto } from './dto/create-inicio-caja.dto';
import { UpdateInicioCajaDto } from './dto/update-inicio-caja.dto';
import { usuarios } from 'src/users/users.entity';
import { BitacoraEdiciones } from 'src/bitacora-ediciones/bitacora-ediciones.entity';
import { BitacoraEliminaciones } from 'src/bitacora-eliminaciones/bitacora-eliminaciones.entity';
import { Transacciones } from 'src/transacciones/entities/transacciones.entity';
import { Sucursal } from 'src/sucursales/entities/sucursales.entity';

@Injectable()
export class IniciosCajaService {
  private MAX_FILE_SIZE_BYTES = 50 * 1024; // Tamaño máximo: 50 KB

  constructor(
    @InjectRepository(IniciosCaja, 'db1')
    private readonly iniciosCajaRepository: Repository<IniciosCaja>,

    @InjectRepository(usuarios, 'db1')
    private readonly usuariosRepository: Repository<usuarios>,

    @InjectRepository(Transacciones, 'db1')
    private readonly transaccionesRepository: Repository<Transacciones>,

    @InjectRepository(Sucursal, 'db1')
    private readonly sucursalesRepository: Repository<Sucursal>,

    @InjectRepository(BitacoraEdiciones, 'db1')
    private readonly bitacoraEdicionesRepository: Repository<BitacoraEdiciones>,

    @InjectRepository(BitacoraEliminaciones, 'db1')
    private readonly bitacoraEliminacionesRepository: Repository<BitacoraEliminaciones>,
  ) { }

  async findAll(): Promise<IniciosCaja[]> {
    return this.iniciosCajaRepository.find({
      relations: ['Usuario', 'UsuarioAutorizo'],
    });
  }

  async findOne(id: number): Promise<IniciosCaja> {
    const inicioCaja = await this.iniciosCajaRepository.findOne({
      where: { InicioCajaID: id },
      relations: ['Usuario', 'UsuarioAutorizo'],
    });
    if (!inicioCaja) {
      throw new HttpException(
        'Inicio de Caja no encontrado',
        HttpStatus.NOT_FOUND,
      );
    }
    return inicioCaja;
  }

 async create(createDto: CreateInicioCajaDto): Promise<IniciosCaja> {
  const {
    UsuarioID,
    UsuarioAutorizoID,
    MontoInicial,
    FirmaElectronica,
    TotalEfectivo,
    TotalTransferencia,
  } = createDto;

  // Verificar si el usuario ya tiene un inicio de caja activo
  const inicioActivo = await this.iniciosCajaRepository.findOne({
    where: { Estatus: 'Activo', Usuario: { UsuarioID } },
    relations: ['Usuario', 'Sucursal'],
  });

  if (inicioActivo) {
    throw new HttpException(
      'El usuario ya tiene un inicio de caja activo',
      HttpStatus.CONFLICT,
    );
  }

  // Validar que todos los campos requeridos estén presentes
  if (!UsuarioID) {
    throw new HttpException(
      'El UsuarioID es obligatorio',
      HttpStatus.BAD_REQUEST,
    );
  }

  if (!UsuarioAutorizoID) {
    throw new HttpException(
      'El UsuarioAutorizoID es obligatorio',
      HttpStatus.BAD_REQUEST,
    );
  }

  // Validar si el UsuarioID existe
  const usuario = await this.usuariosRepository.findOne({
    where: { UsuarioID: UsuarioID },
  });
  if (!usuario) {
    throw new HttpException('Usuario no encontrado', HttpStatus.NOT_FOUND);
  }

  // Validar si el UsuarioAutorizoID existe
  const usuarioAutorizo = await this.usuariosRepository.findOne({
    where: { UsuarioID: UsuarioAutorizoID },
  });
  if (!usuarioAutorizo) {
    throw new HttpException(
      'Usuario autorizador no encontrado',
      HttpStatus.NOT_FOUND,
    );
  }

  // ➕ NUEVO: validar que el usuario tenga sucursal y obtenerla
  if (!usuario.SucursalID) {
    throw new HttpException(
      'El usuario no tiene una sucursal asignada',
      HttpStatus.BAD_REQUEST,
    );
  }

  const sucursal = await this.sucursalesRepository.findOne({
    where: { SucursalID: usuario.SucursalID },
  });

  if (!sucursal) {
    throw new HttpException(
      'No se encontró la sucursal asociada al usuario',
      HttpStatus.NOT_FOUND,
    );
  }

  // Validar firma electrónica (Base64)
  /* if (!FirmaElectronica) {
     throw new HttpException(
       'La FirmaElectronica es obligatoria',
       HttpStatus.BAD_REQUEST,
     );
   }*/

  // if (!this.isValidBase64(FirmaElectronica)) {
  //   throw new HttpException(
  //     'La FirmaElectronica no es válida',
  //     HttpStatus.BAD_REQUEST,
  //   );
  // }

  // if (!this.isValidBase64Size(FirmaElectronica)) {
  //   throw new HttpException(
  //     `La FirmaElectronica excede el tamaño máximo permitido de ${
  //       this.MAX_FILE_SIZE_BYTES / 1024
  //     } KB`,
  //     HttpStatus.BAD_REQUEST,
  //   );
  // }

  // Crear el nuevo inicio de caja
  const nuevoInicioCaja = this.iniciosCajaRepository.create({
    Usuario: usuario,
    UsuarioAutorizo: usuarioAutorizo,
    Sucursal: sucursal,        // 👈 NUEVO: se asigna la sucursal automáticamente
    MontoInicial,
    TotalEfectivo,
    TotalTransferencia,
    FirmaElectronica,
    Estatus: 'Activo', // Valor por defecto definido en el entity
  });

  const savedInicioCaja =
    await this.iniciosCajaRepository.save(nuevoInicioCaja);

  // Registro en la bitácora de ediciones
  const bitacora = this.bitacoraEdicionesRepository.create({
    Entidad: 'IniciosCaja',
    EntidadID: savedInicioCaja.InicioCajaID,
    CamposModificados: createDto,
    UsuarioEdicion: usuario.NombreUsuario,
  });
  await this.bitacoraEdicionesRepository.save(bitacora);

  return savedInicioCaja;
}


  async update(
    id: number,
    updateDto: UpdateInicioCajaDto,
  ): Promise<IniciosCaja> {
    const inicioCaja = await this.findOne(id);

    const camposModificados: Record<string, { anterior: any; nuevo: any }> = {};

    // Validar y actualizar UsuarioID
    if (updateDto.UsuarioID) {
      const usuario = await this.usuariosRepository.findOne({
        where: { UsuarioID: updateDto.UsuarioID },
      });
      if (!usuario) {
        throw new HttpException('Usuario no encontrado', HttpStatus.NOT_FOUND);
      }
      if (inicioCaja.Usuario.UsuarioID !== updateDto.UsuarioID) {
        camposModificados['UsuarioID'] = {
          anterior: inicioCaja.Usuario.UsuarioID,
          nuevo: updateDto.UsuarioID,
        };
        inicioCaja.Usuario = usuario;
      }
    }

    // Validar y actualizar UsuarioAutorizoID
    if (updateDto.UsuarioAutorizoID) {
      const usuarioAutorizo = await this.usuariosRepository.findOne({
        where: { UsuarioID: updateDto.UsuarioAutorizoID },
      });
      if (!usuarioAutorizo) {
        throw new HttpException(
          'Usuario autorizador no encontrado',
          HttpStatus.NOT_FOUND,
        );
      }
      if (
        inicioCaja.UsuarioAutorizo?.UsuarioID !== updateDto.UsuarioAutorizoID
      ) {
        camposModificados['UsuarioAutorizoID'] = {
          anterior: inicioCaja.UsuarioAutorizo?.UsuarioID,
          nuevo: updateDto.UsuarioAutorizoID,
        };
        inicioCaja.UsuarioAutorizo = usuarioAutorizo;
      }
    }


    // Validar y actualizar FirmaElectronica
    if (updateDto.FirmaElectronica) {
      if (!this.isValidBase64(updateDto.FirmaElectronica)) {
        throw new HttpException(
          'La firma electrónica no es válida',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (!this.isValidBase64Size(updateDto.FirmaElectronica)) {
        throw new HttpException(
          `La firma electrónica excede el tamaño máximo permitido de ${this.MAX_FILE_SIZE_BYTES / 1024
          } KB`,
          HttpStatus.BAD_REQUEST,
        );
      }
      if (inicioCaja.FirmaElectronica !== updateDto.FirmaElectronica) {
        camposModificados['FirmaElectronica'] = {
          anterior: inicioCaja.FirmaElectronica,
          nuevo: updateDto.FirmaElectronica,
        };
        inicioCaja.FirmaElectronica = updateDto.FirmaElectronica;
      }
    }

    // Validar y actualizar MontoInicial
    if (
      updateDto.MontoInicial !== undefined &&
      updateDto.MontoInicial !== null
    ) {
      if (updateDto.MontoInicial <= 0) {
        throw new HttpException(
          'El MontoInicial debe ser mayor a 0',
          HttpStatus.BAD_REQUEST,
        );
      }
      if (inicioCaja.MontoInicial !== updateDto.MontoInicial) {
        camposModificados['MontoInicial'] = {
          anterior: inicioCaja.MontoInicial,
          nuevo: updateDto.MontoInicial,
        };
        inicioCaja.MontoInicial = updateDto.MontoInicial;
      }
    }

    // Validar y actualizar TotalEfectivo
    if (
      updateDto.TotalEfectivo !== undefined &&
      updateDto.TotalEfectivo !== null
    ) {
      if (inicioCaja.TotalEfectivo !== updateDto.TotalEfectivo) {
        camposModificados['TotalEfectivo'] = {
          anterior: inicioCaja.TotalEfectivo,
          nuevo: updateDto.TotalEfectivo,
        };
        inicioCaja.TotalEfectivo = updateDto.TotalEfectivo;
      }
    }

    // Validar y actualizar TotalTransferencia
    if (
      updateDto.TotalTransferencia !== undefined &&
      updateDto.TotalTransferencia !== null
    ) {
      if (inicioCaja.TotalTransferencia !== updateDto.TotalTransferencia) {
        camposModificados['TotalTransferencia'] = {
          anterior: inicioCaja.TotalTransferencia,
          nuevo: updateDto.TotalTransferencia,
        };
        inicioCaja.TotalTransferencia = updateDto.TotalTransferencia;
      }
    }

    // Validar y actualizar Estatus
    if (updateDto.Estatus) {
      const validStatuses = ['Activo', 'Cerrado', 'Pendiente'];
      if (!validStatuses.includes(updateDto.Estatus)) {
        throw new HttpException(
          `Estatus debe ser uno de los siguientes: ${validStatuses.join(', ')}`,
          HttpStatus.BAD_REQUEST,
        );
      }
      if (inicioCaja.Estatus !== updateDto.Estatus) {
        camposModificados['Estatus'] = {
          anterior: inicioCaja.Estatus,
          nuevo: updateDto.Estatus,
        };
        inicioCaja.Estatus = updateDto.Estatus;
      }
    }

    // Guardar cambios
    const updatedInicioCaja = await this.iniciosCajaRepository.save(inicioCaja);

    // Registro en la bitácora de ediciones
    if (Object.keys(camposModificados).length > 0) {
      const bitacora = this.bitacoraEdicionesRepository.create({
        Entidad: 'IniciosCaja',
        EntidadID: updatedInicioCaja.InicioCajaID,
        CamposModificados: camposModificados,
        UsuarioEdicion: inicioCaja.Usuario.NombreUsuario,
      });
      await this.bitacoraEdicionesRepository.save(bitacora);
    }

    return updatedInicioCaja;
  }

  async findActive(usuarioID: number): Promise<IniciosCaja> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
  
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
  
    // 🔄 1. Desactivar inicios anteriores activos no ligados a corte
    const iniciosAntiguos = await this.iniciosCajaRepository.find({
      where: {
        Estatus: 'Activo',
        Usuario: { UsuarioID: usuarioID },
        FechaInicio: LessThan(todayStart),
      },
    });
  
    for (const inicio of iniciosAntiguos) {
      inicio.Estatus = 'Cerrado';
      await this.iniciosCajaRepository.save(inicio);
    }
  
    // 📅 2. Buscar el inicio activo de hoy
    const inicioActivo = await this.iniciosCajaRepository.findOne({
      where: {
        Estatus: 'Activo',
        Usuario: { UsuarioID: usuarioID },
        FechaInicio: Between(todayStart, todayEnd),
      },
      relations: ['Usuario', 'UsuarioAutorizo'],
    });
  
    if (!inicioActivo) {
      throw new HttpException(
        'No hay ningún inicio de caja activo para este usuario el día de hoy',
        HttpStatus.NOT_FOUND,
      );
    }
  
    return inicioActivo;
  }
  

  async remove(id: number, usuarioID: number, motivo: string): Promise<string> {
    // Verificar si el InicioCaja tiene transacciones asociadas
    const transaccionesRelacionadas = await this.transaccionesRepository.count({
      where: { InicioCaja: { InicioCajaID: id } },
    });

    if (transaccionesRelacionadas > 0) {
      throw new HttpException(
        `No se puede eliminar el Inicio de Caja con ID ${id} porque tiene ${transaccionesRelacionadas} transacciones asociadas.`,
        HttpStatus.CONFLICT,
      );
    }

    // Buscar el InicioCaja por ID y usuario
    const inicioCaja = await this.iniciosCajaRepository.findOne({
      where: { InicioCajaID: id, Usuario: { UsuarioID: usuarioID } },
    });

    if (!inicioCaja) {
      throw new HttpException(
        'Inicio de Caja no encontrado o no pertenece al usuario especificado',
        HttpStatus.NOT_FOUND,
      );
    }

    // Eliminar el registro
    await this.iniciosCajaRepository.remove(inicioCaja);

    // Registrar en la bitácora de eliminaciones
    const bitacora = this.bitacoraEliminacionesRepository.create({
      Entidad: 'IniciosCaja',
      EntidadID: id,
      UsuarioEliminacion: inicioCaja.Usuario.NombreUsuario,
      MotivoEliminacion: motivo,
    });
    await this.bitacoraEliminacionesRepository.save(bitacora);

    return `Inicio de Caja con ID ${id} eliminado exitosamente.`;
  }

  private isValidBase64(base64: string): boolean {
    const base64Regex = /^data:(image\/[a-zA-Z]+);base64,[A-Za-z0-9+/=]+$/;
    return base64Regex.test(base64);
  }

  private isValidBase64Size(base64: string): boolean {
    const headerLength = base64.indexOf(',') + 1; // Longitud de la cabecera
    const base64Data = base64.substring(headerLength); // Solo el contenido de la imagen
    const sizeInBytes =
      (base64Data.length * 3) / 4 -
      (base64Data.endsWith('==') ? 2 : base64Data.endsWith('=') ? 1 : 0);
    return sizeInBytes <= this.MAX_FILE_SIZE_BYTES;
  }
}
