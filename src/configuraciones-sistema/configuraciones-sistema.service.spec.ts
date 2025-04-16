import { Test, TestingModule } from '@nestjs/testing';
import { ConfiguracionesSistemaService  } from './configuraciones-sistema.service';

describe('ConfiguracionesSistemaService', () => {
  let service: ConfiguracionesSistemaService ;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConfiguracionesSistemaService ],
    }).compile();

    service = module.get<ConfiguracionesSistemaService >(ConfiguracionesSistemaService );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
