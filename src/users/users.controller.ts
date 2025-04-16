import { Controller, Get, Post, Patch, Body, Param, HttpException, HttpStatus } from '@nestjs/common';
import { UsersService } from './users.service';
import { usuarios } from './users.entity';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  async register(
    @Body() body: { username: string; password: string; idGroup: number; EmpleadoID?: number },
  ): Promise<usuarios> {
    const { username, password, idGroup, EmpleadoID } = body;
  
    if (!username || !password || !idGroup) {
      throw new HttpException(
        'Todos los campos son obligatorios: username, password, idGroup',
        HttpStatus.BAD_REQUEST,
      );
    }
  
    return this.usersService.create(username, password, idGroup, EmpleadoID);
  }
  

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new HttpException('ID inválido', HttpStatus.BAD_REQUEST);
    }

    return this.usersService.findOneById(numericId);
  }

  @Get()
  async findAll() {
    return this.usersService.findAll();
  }

  @Patch(':id')
  async update(
    @Param('id') id: number,
    @Body() body: { username?: string; password?: string; idGroup?: number; EmpleadoID?: number },
  ) {
    const { username, password, idGroup, EmpleadoID } = body;
  
    if (!username && !password && !idGroup && EmpleadoID === undefined) {
      throw new HttpException(
        'Debe proporcionar al menos un campo para actualizar: username, password, idGroup, o EmpleadoID',
        HttpStatus.BAD_REQUEST,
      );
    }
  
    return this.usersService.updateUser(id, username, password, idGroup, EmpleadoID);
  }
  
}
