import { Test, TestingModule } from '@nestjs/testing';
import { ConfiguracionesSistemaController  } from './configuraciones-sistema.controller';

describe('ConfiguracionesSistemaController', () => {
  let controller: ConfiguracionesSistemaController ;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConfiguracionesSistemaController]
      ,
    }).compile();

    controller = module.get<ConfiguracionesSistemaController >(ConfiguracionesSistemaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
