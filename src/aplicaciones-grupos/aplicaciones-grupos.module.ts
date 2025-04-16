import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApplicationsGrupos } from './aplicaciones-grupos.entity';
import { ApplicationsGruposService } from './aplicaciones-grupos.service';
import { ApplicationsGruposController } from './aplicaciones-grupos.controller';
import { aplicaciones } from '../applications/applications.entity';
import { grupos } from '../groups/groups.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ApplicationsGrupos, aplicaciones, grupos], 'db1'), // Asegúrate de usar la conexión correcta
  ],
  controllers: [ApplicationsGruposController],
  providers: [ApplicationsGruposService],
  exports: [ApplicationsGruposService], // Asegúrate de exportar el servicio
})
// prueba deploy automatico
export class ApplicationsGruposModule {}
