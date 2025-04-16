import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cobertura_Deducible } from './cobertura-deducible.entity';
import { CoberturaDeducibleService } from './cobertura-deducible.service';
import { CoberturaDeducibleController } from './cobertura-deducible.controller';


@Module({
  imports: [
    TypeOrmModule.forFeature([Cobertura_Deducible], 'db1')
  ],
  controllers: [CoberturaDeducibleController],
  providers: [CoberturaDeducibleService],
  exports: [TypeOrmModule, CoberturaDeducibleService]
})
export class CoberturaDeducibleModule {}
