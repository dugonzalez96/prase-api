import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { grupos } from './groups.entity';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(grupos, 'db1')
    private groupsRepository: Repository<grupos>,
  ) {}

  async findAll(): Promise<grupos[]> {
    return this.groupsRepository.find();
  }

  async findOne(id: number): Promise<grupos> {
    const group = await this.groupsRepository.findOne({ where: { id } });
    return group ? group : null;
  }

  async create(group: grupos): Promise<grupos> {
    const newGroup = this.groupsRepository.create(group);
    return this.groupsRepository.save(newGroup);
  }

  async update(id: number, group: grupos): Promise<grupos> {
    await this.groupsRepository.update(id, group);
    return this.findOne(id);
  }

  async remove(id: number): Promise<{ message: string }> {
    const group = await this.findOne(id);
    if (!group) {
      throw new HttpException('Grupo no encontrado', HttpStatus.NOT_FOUND);
    }

    await this.groupsRepository.delete(id);
    return { message: `Grupo con ID ${id} ha sido eliminado exitosamente.` };
  }
}
