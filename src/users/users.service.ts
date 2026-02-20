import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { usuarios } from './users.entity';
import { grupos_has_usuarios } from './users_groups.entity';
import { grupos } from '../groups/groups.entity';
import * as bcrypt from 'bcrypt';
import { Empleado } from 'src/empleados/entity/empleado.entity';
import { Sucursal } from 'src/sucursales/entities/sucursales.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(usuarios, 'db1')
    private usersRepository: Repository<usuarios>,

    @InjectRepository(grupos_has_usuarios, 'db1')
    private gruposUsuariosRepository: Repository<grupos_has_usuarios>,

    @InjectRepository(grupos, 'db1')
    private gruposRepository: Repository<grupos>,

    @InjectRepository(Empleado, 'db1')
    private empleadosRepository: Repository<Empleado>,

    @InjectRepository(Sucursal, 'db1')
    private sucursalesRepository: Repository<Sucursal>,
  ) {}

  async findOne(NombreUsuario: string): Promise<usuarios | undefined> {
    return this.usersRepository.findOne({ where: { NombreUsuario } });
  }
  async create(
    username: string,
    password: string,
    idGroup: number,
    empleadoID?: number,
    sucursalID?: number,
  ): Promise<usuarios> {
    // Validar si el nombre de usuario ya existe
    const userExists = await this.usersRepository.findOne({
      where: { NombreUsuario: username },
    });
    if (userExists) {
      throw new HttpException(
        'El nombre de usuario ya está en uso',
        HttpStatus.CONFLICT,
      );
    }

    // Validar si el nombre de usuario ya existe con el mismo EmpleadoID
    const existingUserWithEmpleado = await this.usersRepository.findOne({
      where: { NombreUsuario: username, EmpleadoID: empleadoID },
    });
    if (existingUserWithEmpleado) {
      throw new HttpException(
        'Ya existe un usuario con el mismo nombre de usuario y EmpleadoID',
        HttpStatus.CONFLICT,
      );
    }

    // Validar si el EmpleadoID existe
    if (empleadoID) {
      const empleadoExists = await this.empleadosRepository.findOne({
        where: { EmpleadoID: empleadoID },
      });
      if (!empleadoExists) {
        throw new HttpException(
          'EmpleadoID no encontrado',
          HttpStatus.NOT_FOUND,
        );
      }
    }

    // Validar si la SucursalID existe
    if (sucursalID) {
      const sucursalExists = await this.sucursalesRepository.findOne({
        where: { SucursalID: sucursalID },
      });
      if (!sucursalExists) {
        throw new HttpException(
          'SucursalID no encontrada',
          HttpStatus.NOT_FOUND,
        );
      }
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    // Crear el nuevo usuario incluyendo EmpleadoID
    const newUser = this.usersRepository.create({
      NombreUsuario: username,
      Contrasena: hashedPassword,
      EmpleadoID: empleadoID || null,
      SucursalID: sucursalID || null,
    });

    const resUser = await this.usersRepository.save(newUser);

    // Validar el grupo antes de asociarlo
    const group = await this.gruposRepository.findOne({
      where: { id: idGroup },
    });
    if (!group) {
      throw new HttpException('Grupo no encontrado', HttpStatus.NOT_FOUND);
    }

    // Crear la asociación entre usuario y grupo
    const newUserGroup = this.gruposUsuariosRepository.create({
      grupos: group,
      usuarios: resUser,
    });

    await this.gruposUsuariosRepository.save(newUserGroup);

    return resUser;
  }

  async updateUser(
    id: number,
    username?: string,
    password?: string,
    idGroup?: number,
    empleadoID?: number,
    sucursalID?: number,
  ): Promise<usuarios> {
    // Buscar el usuario
    const user = await this.usersRepository.findOne({
      where: { UsuarioID: id },
    });

    if (!user) {
      throw new HttpException('Usuario no encontrado', HttpStatus.NOT_FOUND);
    }

    // Validar y actualizar EmpleadoID si se envía
    if (empleadoID !== undefined) {
      const empleadoExists = await this.empleadosRepository.findOne({
        where: { EmpleadoID: empleadoID },
      });
      if (!empleadoExists) {
        throw new HttpException(
          'EmpleadoID no encontrado',
          HttpStatus.NOT_FOUND,
        );
      }
      user.EmpleadoID = empleadoID;
    }

    // Validar y actualizar SucursalID si se envía
    if (sucursalID !== undefined) {
      const sucursalExists = await this.sucursalesRepository.findOne({
        where: { SucursalID: sucursalID },
      });
      if (!sucursalExists) {
        throw new HttpException(
          'SucursalID no encontrada',
          HttpStatus.NOT_FOUND,
        );
      }
      user.SucursalID = sucursalID;
    }

    // Actualizar NombreUsuario si se envía
    if (username) {
      user.NombreUsuario = username;
    }

    // Cifrar y actualizar la contraseña si se envía
    if (password) {
      const salt = await bcrypt.genSalt();
      user.Contrasena = await bcrypt.hash(password, salt);
    }

    // Guardar cambios en la base de datos
    await this.usersRepository.save(user);

    // Actualizar grupo si se envía
    if (idGroup !== undefined) {
      const group = await this.gruposRepository.findOne({
        where: { id: idGroup },
      });
      if (!group) {
        throw new HttpException('Grupo no encontrado', HttpStatus.NOT_FOUND);
      }

      const existingRelation = await this.gruposUsuariosRepository.findOne({
        where: { usuarios: { UsuarioID: id } },
      });

      if (existingRelation) {
        existingRelation.grupos = group;
        await this.gruposUsuariosRepository.save(existingRelation);
      } else {
        const newRelation = this.gruposUsuariosRepository.create({
          grupos: group,
          usuarios: user,
        });
        await this.gruposUsuariosRepository.save(newRelation);
      }
    }

    // Retornar el usuario actualizado
    return user;
  }

  async findOneById(id: number): Promise<any> {
    const user = await this.usersRepository.findOne({
      where: { UsuarioID: id },
    });
    if (!user) {
      throw new HttpException('Usuario no encontrado', HttpStatus.NOT_FOUND);
    }

    const userGroup = await this.gruposUsuariosRepository.findOne({
      where: { usuarios: { UsuarioID: id } },
      relations: ['grupos'],
    });

    return {
      ...user,
      grupo: userGroup ? userGroup.grupos.id : null,
    };
  }

  async findAll(): Promise<any[]> {
    const users = await this.usersRepository.find();
    const usersWithGroups = await Promise.all(
      users.map(async (user) => {
        const userGroup = await this.gruposUsuariosRepository.findOne({
          where: { usuarios: { UsuarioID: user.UsuarioID } },
          relations: ['grupos'],
        });
        return {
          ...user,
          grupo: userGroup ? userGroup.grupos.id : null,
        };
      }),
    );
    return usersWithGroups;
  }
}
