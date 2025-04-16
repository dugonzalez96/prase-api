import { Controller, Get, Post, Body, Param, Patch, Delete } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { grupos } from './groups.entity';

@Controller('groups')
export class GroupsController {
  constructor(private groupsService: GroupsService) { }

  @Get()
  async findAll(): Promise<grupos[]> {
    return this.groupsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: number): Promise<grupos> {
    return this.groupsService.findOne(id);
  }

  @Post()
  async create(@Body() group: grupos): Promise<grupos> {
    return this.groupsService.create(group);
  }

  @Patch(':id')
  async update(@Param('id') id: number, @Body() group: grupos): Promise<grupos> {
    return this.groupsService.update(id, group);
  }

  @Delete(':id')
  async remove(@Param('id') id: number): Promise<{ message: string }> {
    return this.groupsService.remove(id);
  }
}
