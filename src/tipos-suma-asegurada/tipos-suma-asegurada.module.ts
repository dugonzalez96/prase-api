import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TiposSumaAsegurada } from './tipos-suma-asegurada.entity';
import { TiposSumaAseguradaService } from './tipos-suma-asegurada.service';
import { TiposSumaAseguradaController } from './tipos-suma-asegurada.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TiposSumaAsegurada], 'db1')],
  providers: [TiposSumaAseguradaService],
  controllers: [TiposSumaAseguradaController],
})
export class TiposSumaAseguradaModule {}