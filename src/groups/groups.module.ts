import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupsService } from "./groups.service";
import { GroupsController } from "./groups.controller";
import { grupos } from './groups.entity';


@Module({
    imports: [
      TypeOrmModule.forFeature([grupos], 'db1'),
    ],
    providers: [GroupsService],
    controllers: [GroupsController],
    exports: [GroupsService],
  })
export class GroupsModule {}
