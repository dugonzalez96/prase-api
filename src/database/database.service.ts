import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseService {
  constructor(private readonly dataSource: DataSource) {}

  // Obtener el listado de tablas en la base de datos
  async getTables(): Promise<string[]> {
    const query = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'ajustesfactoresriesgo';
    `;
    const result = await this.dataSource.query(query);
    return result.map((row: any) => row.table_name);
  }

  // Obtener columnas y sus tipos de datos de una tabla específica
  async getTableColumns(tableName: string): Promise<{ column: string; type: string }[]> {
    const query = `
      SELECT column_name AS column, data_type AS type
      FROM information_schema.columns
      WHERE table_schema = 'ajustesfactoresriesgo' AND table_name = ?
    `;
    const result = await this.dataSource.query(query, [tableName]);

    if (result.length === 0) {
      throw new HttpException(`Tabla '${tableName}' no encontrada`, HttpStatus.NOT_FOUND);
    }
    return result;
  }

  // Obtener todos los datos de una tabla específica
  async getAllFromTable(tableName: string): Promise<any[]> {
    try {
      return await this.dataSource.query(`SELECT * FROM ${tableName}`);
    } catch (error) {
      throw new HttpException(`Error al obtener datos de la tabla '${tableName}'`, HttpStatus.BAD_REQUEST);
    }
  }
}
