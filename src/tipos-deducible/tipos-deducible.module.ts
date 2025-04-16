import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TiposDeducibleService } from './tipos-deducible.service';
import { TiposDeducibleController } from './tipos-deducible.controller';
import { TiposDeducible } from './tipos-deducible.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TiposDeducible], 'db1')],
  controllers: [TiposDeducibleController],
  providers: [TiposDeducibleService],
  exports: [TypeOrmModule,TiposDeducibleService],
})
export class TiposDeducibleModule {}


