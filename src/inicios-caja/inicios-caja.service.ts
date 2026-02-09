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

  // Timezone helpers (mismo patrón que caja-general.service.ts)
  private getTimezoneOffset(timezone?: string): string {
    if (!timezone) return '-07:00';
    const timezoneMap: Record<string, string> = {
      'America/Mazatlan': '-07:00',
      'America/Mexico_City': '-06:00',
      'America/Hermosillo': '-07:00',
      'America/Chihuahua': '-06:00',
      'America/Tijuana': '-08:00',
    };
    return timezoneMap[timezone] || '-07:00';
  }

  private convertUTCToLocal(dateUTC: Date, timezoneOffset: string): Date {
    if (!dateUTC) return dateUTC;
    const [hours, minutes] = timezoneOffset.split(':').map(Number);
    const offsetMinutes = hours * 60 + (hours < 0 ? -minutes : minutes);
    return new Date(dateUTC.getTime() + offsetMinutes * 60000);
  }

  async findAll(): Promise<IniciosCaja[]> {
    const inicios = await this.iniciosCajaRepository.find({
      relations: ['Usuario', 'UsuarioAutorizo', 'Sucursal'],
    });
    inicios.forEach((i) => {
      const offset = this.getTimezoneOffset(i.Sucursal?.Timezone);
      i.FechaInicio = this.convertUTCToLocal(i.FechaInicio, offset);
    });
    return inicios;
  }

  async findOne(id: number): Promise<IniciosCaja> {
    const inicioCaja = await this.iniciosCajaRepository.findOne({
      where: { InicioCajaID: id },
      relations: ['Usuario', 'UsuarioAutorizo', 'Sucursal'],
    });
    if (!inicioCaja) {
      throw new HttpException(
        'Inicio de Caja no encontrado',
        HttpStatus.NOT_FOUND,
      );
    }
    const offset = this.getTimezoneOffset(inicioCaja.Sucursal?.Timezone);
    inicioCaja.FechaInicio = this.convertUTCToLocal(inicioCaja.FechaInicio, offset);
    return inicioCaja;
  }

 async create(createDto: CreateInicioCajaDto): Promise<IniciosCaja> {
  console.log('🔄 IniciosCajaService.create() - Iniciando...');
  console.log('   DTO recibido:', JSON.stringify(createDto, null, 2));

  const {
    UsuarioID,
    UsuarioAutorizoID,
    MontoInicial,
    FirmaElectronica,
    TotalEfectivo,
    TotalTransferencia,
  } = createDto;

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

  if (MontoInicial === undefined || MontoInicial === null) {
    throw new HttpException(
      'El MontoInicial es obligatorio',
      HttpStatus.BAD_REQUEST,
    );
  }

  if (TotalEfectivo === undefined || TotalEfectivo === null) {
    throw new HttpException(
      'El TotalEfectivo es obligatorio',
      HttpStatus.BAD_REQUEST,
    );
  }

  if (TotalTransferencia === undefined || TotalTransferencia === null) {
    throw new HttpException(
      'El TotalTransferencia es obligatorio',
      HttpStatus.BAD_REQUEST,
    );
  }

  // Verificar si el usuario ya tiene un inicio de caja activo
  console.log('   Verificando si existe inicio de caja activo para usuario:', UsuarioID);
  const inicioActivo = await this.iniciosCajaRepository.findOne({
    where: { Estatus: 'Activo', Usuario: { UsuarioID } },
    relations: ['Usuario', 'Sucursal'],
  });

  if (inicioActivo) {
    console.log('   ❌ Usuario ya tiene inicio de caja activo:', inicioActivo.InicioCajaID);
    throw new HttpException(
      `El usuario ya tiene un inicio de caja activo (ID: ${inicioActivo.InicioCajaID})`,
      HttpStatus.CONFLICT,
    );
  }
  console.log('   ✅ No hay inicio de caja activo');

  // Validar si el UsuarioID existe
  console.log('   Buscando usuario con ID:', UsuarioID);
  const usuario = await this.usuariosRepository.findOne({
    where: { UsuarioID: UsuarioID },
  });
  if (!usuario) {
    throw new HttpException(
      `Usuario con ID ${UsuarioID} no encontrado`,
      HttpStatus.NOT_FOUND,
    );
  }
  console.log('   ✅ Usuario encontrado:', usuario.NombreUsuario);

  // Validar si el UsuarioAutorizoID existe
  console.log('   Buscando usuario autorizador con ID:', UsuarioAutorizoID);
  const usuarioAutorizo = await this.usuariosRepository.findOne({
    where: { UsuarioID: UsuarioAutorizoID },
  });
  if (!usuarioAutorizo) {
    throw new HttpException(
      `Usuario autorizador con ID ${UsuarioAutorizoID} no encontrado`,
      HttpStatus.NOT_FOUND,
    );
  }
  console.log('   ✅ Usuario autorizador encontrado:', usuarioAutorizo.NombreUsuario);

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
  console.log('   📝 Creando entidad de inicio de caja...');
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

  try {
    console.log('   💾 Guardando inicio de caja en base de datos...');
    const savedInicioCaja = await this.iniciosCajaRepository.save(nuevoInicioCaja);
    console.log('   ✅ Inicio de caja guardado con ID:', savedInicioCaja.InicioCajaID);

    // Registro en la bitácora de ediciones
    const bitacora = this.bitacoraEdicionesRepository.create({
      Entidad: 'IniciosCaja',
      EntidadID: savedInicioCaja.InicioCajaID,
      CamposModificados: createDto,
      UsuarioEdicion: usuario.NombreUsuario,
    });
    await this.bitacoraEdicionesRepository.save(bitacora);

    return savedInicioCaja;
  } catch (dbError) {
    console.error('   ❌ Error de base de datos al guardar inicio de caja:', {
      message: dbError.message,
      code: dbError.code,
      sqlMessage: dbError.sqlMessage,
    });
    throw new HttpException(
      `Error al guardar inicio de caja: ${dbError.message}`,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
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
      relations: ['Usuario', 'UsuarioAutorizo', 'Sucursal'],
    });

    if (!inicioActivo) {
      throw new HttpException(
        'No hay ningún inicio de caja activo para este usuario el día de hoy',
        HttpStatus.NOT_FOUND,
      );
    }

    const offset = this.getTimezoneOffset(inicioActivo.Sucursal?.Timezone);
    inicioActivo.FechaInicio = this.convertUTCToLocal(inicioActivo.FechaInicio, offset);

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
