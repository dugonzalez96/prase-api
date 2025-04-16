import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TiposMonedaService } from './tipos-moneda.service';
import { TiposMonedaController } from './tipos-moneda.controller';
import { TiposMoneda } from './tipos-moneda.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TiposMoneda], 'db1')],
  controllers: [TiposMonedaController],
  providers: [TiposMonedaService],
  exports: [TypeOrmModule,TiposMonedaService],
})
export class TiposMonedaModule {}
