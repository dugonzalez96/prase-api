import { Module } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { DatabaseController } from './database.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Module({
    imports: [
        TypeOrmModule.forRoot({
          type: 'mysql', // O el tipo de base de datos que uses
          host: 'localhost',
          port: 3306,
          username: 'root',
          password: 'password',
          database: 'ajustesfactoresriesgo',
          entities: [],
          synchronize: false,
        }),
      ],
    controllers: [DatabaseController],
    providers: [DatabaseService],
    exports: [TypeOrmModule, DatabaseService]
  })
export class DatabaseModule {}

