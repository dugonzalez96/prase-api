import { Test, TestingModule } from '@nestjs/testing';
import { DeduciblesController  } from './deducibles.controller';

describe('PaqueteCoberturasController', () => {
  let controller: DeduciblesController ;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DeduciblesController]
      ,
    }).compile();

    controller = module.get<DeduciblesController >(DeduciblesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
