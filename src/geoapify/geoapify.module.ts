import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios'; // Importar HttpModule desde @nestjs/axios
import { GeoapifyService } from './geoapify.service';
import { GeoapifyController } from './geoapify.controller';

@Module({
    imports: [HttpModule], // Importar HttpModule aquí
    providers: [GeoapifyService],
    controllers: [GeoapifyController],
    exports: [GeoapifyService],
})
export class GeoapifyModule { }

