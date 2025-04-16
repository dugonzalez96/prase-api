import { Test, TestingModule } from '@nestjs/testing';
import { CondicionesReglasController  } from './condiciones-reglas.controller';

describe('CondicionesReglasController', () => {
  let controller: CondicionesReglasController ;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CondicionesReglasController]
      ,
    }).compile();

    controller = module.get<CondicionesReglasController >(CondicionesReglasController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
