import { Test, TestingModule } from '@nestjs/testing';
import { AplicacionReglasService } from './aplicacion-reglas.service';

describe('AplicacionReglasService   ', () => {
  let service: AplicacionReglasService   ;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AplicacionReglasService ],
    }).compile();

    service = module.get<AplicacionReglasService >(AplicacionReglasService   );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
