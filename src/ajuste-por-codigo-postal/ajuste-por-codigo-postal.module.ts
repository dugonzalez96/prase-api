import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AjustePorCodigoPostal } from './ajuste-por-codigo-postal.entity';
import { AjustePorCodigoPostalService } from './ajuste-por-codigo-postal.service';
import { AjustePorCodigoPostalController } from './ajuste-por-codigo-postal.controller';


@Module({
  imports: [
    TypeOrmModule.forFeature([AjustePorCodigoPostal], 'db1'), 
  ],
  controllers: [AjustePorCodigoPostalController],
  providers: [AjustePorCodigoPostalService],
  exports: [TypeOrmModule, AjustePorCodigoPostalService]
})
export class AjustePorCodigoPostalModule    {}
