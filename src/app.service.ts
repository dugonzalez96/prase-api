import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): { mensaje: string } {
    return {
      mensaje: 'API PRASE'
    }
  }
}
