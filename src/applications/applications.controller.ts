import { Controller, Get, Post, Body, Param, Patch, Delete  } from '@nestjs/common';
import { ApplicationsService  } from "./applications.service";
import { aplicaciones } from "./applications.entity";


@Controller('applications')
export class ApplicationsController {
    constructor(private applicationsService: ApplicationsService){}
    @Post()
  async create(@Body() application: aplicaciones): Promise<aplicaciones> {
    return this.applicationsService.create(application);
  }

  @Get()
  async findAll(): Promise<aplicaciones[]> {
    return this.applicationsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: number): Promise<aplicaciones> {
    return this.applicationsService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: number, @Body() application: aplicaciones): Promise<aplicaciones> {
    return this.applicationsService.update(id, application);
  }

  @Delete(':id')
  async remove(@Param('id') id: number): Promise<void> {
    return this.applicationsService.remove(id);
  }
}
