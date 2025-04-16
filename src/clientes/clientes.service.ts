import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Clientes } from './clientes.entity';
import { BitacoraEliminacionesService } from '../bitacora-eliminaciones/bitacora-eliminaciones.service';
import { BitacoraEdicionesService } from '../bitacora-ediciones/bitacora-ediciones.service';


@Injectable()
export class ClientesService {
  constructor(
    @InjectRepository(Clientes, 'db1')  // Si usas múltiples conexiones, 'db1' está bien
    private readonly clientesRepository: Repository<Clientes>,
    private readonly bitacoraEliminacionesService: BitacoraEliminacionesService,
    private readonly bitacoraEdicionesService: BitacoraEdicionesService,
  ) { }

 // Crear un nuevo cliente
 async create(cliente: Partial<Clientes>): Promise<Clientes> {
  return this.clientesRepository.save(cliente);
}

// Obtener todos los clientes
async findAll(): Promise<Clientes[]> {
  return this.clientesRepository.find();
}

// Obtener un cliente por ID
async findOne(id: number): Promise<Clientes> {
  const cliente = await this.clientesRepository.findOne({ where: { ClienteID: id } });
  if (!cliente) {
    throw new HttpException('Cliente no encontrado', HttpStatus.NOT_FOUND);
  }
  return cliente;
}

// Actualizar un cliente por ID y registrar en la bitácora de ediciones
async update(id: number, cliente: Partial<Clientes>, usuario: string): Promise<Clientes> {
  const clienteExistente = await this.findOne(id);
  if (!clienteExistente) {
    throw new HttpException('Cliente no encontrado', HttpStatus.NOT_FOUND);
  }

  // Calcula los cambios realizados
  const camposModificados = {};
  for (const key in cliente) {
    if (cliente[key] !== clienteExistente[key]) {
      camposModificados[key] = {
        anterior: clienteExistente[key],
        nuevo: cliente[key],
      };
    }
  }

  // Realiza la actualización
  await this.clientesRepository.update(id, cliente);

  // Registra la edición en la bitácora
  if (Object.keys(camposModificados).length > 0) {
    await this.bitacoraEdicionesService.registrarEdicion(
      'Clientes',
      id,
      camposModificados,
      usuario,
    );
  }

  return this.findOne(id);  // Devuelve el cliente actualizado
}

async remove(id: number, usuario: string, motivo?: string): Promise<{ message: string }> {
  const cliente = await this.findOne(id);
  if (!cliente) {
    throw new HttpException('Cliente no encontrado', HttpStatus.NOT_FOUND);
  }

  await this.clientesRepository.delete(id);

  // Registra la eliminación en la bitácora
  await this.bitacoraEliminacionesService.registrarEliminacion(
    'Clientes',
    id,
    usuario,
    motivo || 'Eliminación sin motivo especificado',
  );

  // Retornar un mensaje de éxito
  return { message: `El cliente con ID ${id} ha sido eliminado exitosamente por ${usuario}.` };
}
}