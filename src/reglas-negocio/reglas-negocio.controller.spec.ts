import { Test, TestingModule } from '@nestjs/testing';
import { PaqueteCoberturasController  } from './paquete-coberturas.controller';

describe('PaqueteCoberturasController', () => {
  let controller: PaqueteCoberturasController ;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaqueteCoberturasController]
      ,
    }).compile();

    controller = module.get<PaqueteCoberturasController >(PaqueteCoberturasController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
