import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CuentasBancariasService } from './cuentas-bancarias.service';
import { CuentasBancariasController } from './cuentas-bancarias.controller';
import { CuentasBancarias } from './entities/cuentas-bancarias.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CuentasBancarias],'db1')],
  controllers: [CuentasBancariasController],
  providers: [CuentasBancariasService],
})
export class CuentasBancariasModule {}
