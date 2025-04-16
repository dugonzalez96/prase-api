import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EstatusPago } from './entities/estatus-pago.entity';
import { EstatusPagoController } from './estatus-pago.controller';
import { EstatusPagoService } from './estatus-pago.service';


@Module({
  imports: [TypeOrmModule.forFeature([EstatusPago], 'db1')],
  controllers: [EstatusPagoController],
  providers: [EstatusPagoService],
  exports: [EstatusPagoService],
})
export class EstatusPagoModule {}
