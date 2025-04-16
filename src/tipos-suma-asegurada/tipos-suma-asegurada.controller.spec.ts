import { Test, TestingModule } from '@nestjs/testing';
import { CoberturaDeducibleController   } from './cobertura-deducible.controller';

describe('PaqueteCoberturasController', () => {
  let controller: CoberturaDeducibleController  ;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CoberturaDeducibleController ]
      ,
    }).compile();

    controller = module.get<CoberturaDeducibleController  >(CoberturaDeducibleController );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
