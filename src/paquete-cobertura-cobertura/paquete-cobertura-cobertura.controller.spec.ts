import { Test, TestingModule } from '@nestjs/testing';
import { PaqueteCobertura_CoberturaController  } from './paquete-cobertura-cobertura.controller';

describe('PaqueteCoberturasController', () => {
  let controller: PaqueteCobertura_CoberturaController ;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaqueteCobertura_CoberturaController]
      ,
    }).compile();

    controller = module.get<PaqueteCobertura_CoberturaController >(PaqueteCobertura_CoberturaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
