import { Test, TestingModule } from '@nestjs/testing';
import { TiposSumaAseguradaService } from './tipos-suma-asegurada.service';

describe('TiposSumaAseguradaService', () => {
  let service: TiposSumaAseguradaService   ;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TiposSumaAseguradaService ],
    }).compile();

    service = module.get<TiposSumaAseguradaService >(TiposSumaAseguradaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
