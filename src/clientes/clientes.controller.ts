import { Controller, Get, Post, Put, Delete, Param, Body, Patch } from '@nestjs/common';
import { ClientesService } from './clientes.service';
import { Clientes } from './clientes.entity';

@Controller('clientes')
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) { }

  // Obtener todos los clientes
  @Get()
  findAll(): Promise<Clientes[]> {
    return this.clientesService.findAll();
  }

  // Crear un nuevo cliente
  @Post()
  create(@Body() cliente: Partial<Clientes>): Promise<Clientes> {
    return this.clientesService.create(cliente);
  }

  // Obtener un cliente por ID
  @Get(':id')
  findOne(@Param('id') id: number): Promise<Clientes> {
    return this.clientesService.findOne(id);
  }

  // Actualizar un cliente por ID y registrar en la bitácora de ediciones
  @Patch(':id/:usuario')
  update(
    @Param('id') id: number,
    @Param('usuario') usuario: string,
    @Body() cliente: Partial<Clientes>,
  ): Promise<Clientes> {
    return this.clientesService.update(id, cliente, usuario);
  }

  // Eliminar un cliente por ID y registrar en la bitácora de eliminaciones
  @Delete(':id/:usuario')
  remove(
    @Param('id') id: number,
    @Param('usuario') usuario: string,
    @Body('motivo') motivo?: string,
  ): Promise<{ message: string }> {
    return this.clientesService.remove(id, usuario, motivo);
  }

}
