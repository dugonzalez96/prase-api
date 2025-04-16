import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { usuarios } from '../users/users.entity';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApplicationsGrupos } from '../aplicaciones-grupos/aplicaciones-grupos.entity';
import { grupos_has_usuarios } from 'src/users/users_groups.entity';
import { Empleado } from 'src/empleados/entity/empleado.entity';
import { Sucursal } from 'src/sucursales/entities/sucursales.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    @InjectRepository(ApplicationsGrupos, 'db1') // Inyectamos el repositorio de aplicaciones_grupos
    private readonly aplicacionesGruposRepository: Repository<ApplicationsGrupos>,
    @InjectRepository(Empleado, 'db1') // Inyectamos el repositorio de aplicaciones_grupos
    private readonly empleadosRepository: Repository<Empleado>,
    @InjectRepository(grupos_has_usuarios, 'db1') // Inyectamos el repositorio de grupos_has_usuarios
    private readonly gruposUsuariosRepository: Repository<grupos_has_usuarios>,
    @InjectRepository(Sucursal, 'db1') // Inyectamos el repositorio de grupos_has_usuarios
    private readonly sucursalesRepository: Repository<Sucursal>,
  ) {}

  async validateUser(
    username: string,
    password: string,
  ): Promise<usuarios | null> {
    const user = await this.usersService.findOne(username);
    console.log(user);
    if (user && (await bcrypt.compare(password, user.Contrasena))) {
      return user;
    }
    return null;
  }

  async login(user: usuarios) {
    // Obtenemos el grupo al que pertenece el usuario

    console.log('🔍 Buscando grupo para usuario:', user.UsuarioID);

    const grupoUsuario = await this.gruposUsuariosRepository.findOne({
      where: { usuarios: { UsuarioID: user.UsuarioID } }, // Usamos la relación 'usuarios' para hacer la consulta
      relations: ['grupos'], // Cargar la relación de 'grupos'
    });

    console.log('🔍 Resultado de grupoUsuario:', grupoUsuario);

    if (!grupoUsuario) {
      throw new Error('No se encontró el grupo del usuario.');
    }

    // Obtenemos las aplicaciones asociadas al grupo
    const aplicaciones = await this.aplicacionesGruposRepository.find({
      where: { grupos: { id: grupoUsuario.grupos.id } }, // Usamos la relación 'grupos'
      relations: ['aplicaciones'], // Para obtener el detalle de la aplicación
    });

    // 🔍 Buscamos la sucursal del usuario si tiene asignada
    let sucursal = null;
    if (user.SucursalID) {
      sucursal = await this.sucursalesRepository.findOne({
        where: { SucursalID: user.SucursalID },
      });
    }

    console.log('🔍 Sucursal encontrada:', sucursal);

    // Obtenemos la información del empleado asociado al usuario
    const empleado = await this.empleadosRepository.findOne({
      where: { EmpleadoID: user.EmpleadoID },
      relations: ['TipoEmpleado'], // Incluimos la relación con TipoEmpleado
    });

    if (!empleado) {
      throw new Error('No se encontró la información del empleado asociado.');
    }

    const payload = { username: user.NombreUsuario, ID: user.UsuarioID };

    // Retornamos el token, las aplicaciones asociadas, la información del usuario, del grupo y del empleado

    return {
      status: 'logged',
      access_token: this.jwtService.sign(payload),
      usuario: {
        UsuarioID: user.UsuarioID,
        NombreUsuario: user.NombreUsuario,
        EmpleadoID: user.EmpleadoID,
      },
      Sucursal: sucursal
      ? {
          SucursalID: sucursal.SucursalID,
          NombreSucursal: sucursal.NombreSucursal,
          Direccion: sucursal.Direccion,
          Ciudad: sucursal.Ciudad,
          Estado: sucursal.Estado,
          Activa: sucursal.Activa,
        }
      : null, // Si no tiene sucursal, devuelve null
      grupo: {
        id: grupoUsuario.grupos.id,
        nombre: grupoUsuario.grupos.nombre,
        descripcion: grupoUsuario.grupos.descripcion,
      },
      empleado: {
        EmpleadoID: empleado.EmpleadoID,
        Nombre: empleado.Nombre,
        Paterno: empleado.Paterno,
        Materno: empleado.Materno,
        FechaNacimiento: empleado.FechaNacimiento,
        SueldoQuincenal: empleado.SueldoQuincenal,
        PorcentajeComisiones: empleado.PorcentajeComisiones,
        TipoEmpleado: empleado.TipoEmpleado
          ? {
              TipoEmpleadoID: empleado.TipoEmpleado.TipoEmpleadoID,
              Nombre: empleado.TipoEmpleado.Descripcion,
            }
          : null, // Si no existe TipoEmpleado, devuelve null
      },
      aplicaciones: aplicaciones.filter((appGrupo) => appGrupo.aplicaciones !== null) // 🔴 Filtra las aplicaciones que no sean null
      .map((appGrupo) => ({
        aplicacionId: appGrupo.aplicaciones.id,
        nombre: appGrupo.aplicaciones.nombre,
        descripcion: appGrupo.aplicaciones.descripcion,
        icon: appGrupo.aplicaciones.icon, // Nuevo campo icon
        color: appGrupo.aplicaciones.color, // Nuevo campo color
        categoria: appGrupo.aplicaciones.categoria, // Nuevo campo categoria
        ingresar: appGrupo.ingresar,
        insertar: appGrupo.insertar,
        eliminar: appGrupo.eliminar,
        actualizar: appGrupo.actualizar,
      })),
    };
  }
}
