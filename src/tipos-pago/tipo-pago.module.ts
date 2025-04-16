import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TipoPago } from './tipo-pago.entity';
import { TipoPagoService } from './tipo-pago.service';
import { TipoPagoController } from './tipo-pago.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TipoPago], 'db1')],
  providers: [TipoPagoService],
  controllers: [TipoPagoController],
})
export class TipoPagoModule {}
