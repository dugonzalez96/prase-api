import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { aplicaciones } from "./applications.entity";
@Injectable()
export class ApplicationsService {
    [x: string]: any;
  constructor(
    @InjectRepository(aplicaciones, 'db1')
    private applicationsRepository: Repository<aplicaciones>,
  ) {}

  async create(application: aplicaciones): Promise<aplicaciones> {
    return this.applicationsRepository.save(application);
  }

  async findAll(): Promise<aplicaciones[]> {
    return this.applicationsRepository.find();
  }

  async findOne(id: number): Promise<aplicaciones> {
    const application = await this.applicationsRepository.findOne({
      where: { id },
    });

    if (application) {
      return application;
    }

    return null;
  }

  async update(id: number, application: aplicaciones): Promise<aplicaciones> {
    await this.applicationsRepository.update(id, application);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.applicationsRepository.delete(id);
  }
}
