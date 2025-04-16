import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Deducibles } from './deducibles.entity';
import { DeduciblesService } from './deducibles.service';
import { DeduciblesController } from './deducibles.controller';


@Module({
  imports: [
    TypeOrmModule.forFeature([Deducibles], 'db1')
  ],
  controllers: [DeduciblesController],
  providers: [DeduciblesService],
  exports: [TypeOrmModule, DeduciblesService]
})
export class DeduciblesModule  {}
