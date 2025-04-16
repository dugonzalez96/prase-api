import { Controller, Get, Param } from '@nestjs/common';
import { DatabaseService } from './database.service';

@Controller('database')
export class DatabaseController {
  constructor(private readonly databaseService: DatabaseService) {}

  @Get('tables')
  getTables() {
    return this.databaseService.getTables();
  }

  @Get('tables/:tableName/columns')
  getTableColumns(@Param('tableName') tableName: string) {
    return this.databaseService.getTableColumns(tableName);
  }

  @Get('tables/:tableName/data')
  getAllFromTable(@Param('tableName') tableName: string) {
    return this.databaseService.getAllFromTable(tableName);
  }
}
