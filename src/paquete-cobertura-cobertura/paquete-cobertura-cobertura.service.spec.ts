import { Test, TestingModule } from '@nestjs/testing';
import { PaqueteCobertura_CoberturaService  } from './paquete-cobertura-cobertura.service';

describe('PaqueteCobertura_CoberturaService ', () => {
  let service: PaqueteCobertura_CoberturaService ;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PaqueteCobertura_CoberturaService ],
    }).compile();

    service = module.get<PaqueteCobertura_CoberturaService >(PaqueteCobertura_CoberturaService );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
