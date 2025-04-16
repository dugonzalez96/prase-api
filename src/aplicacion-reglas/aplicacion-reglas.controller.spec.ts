import { Test, TestingModule } from '@nestjs/testing';
import { AplicacionReglasController } from './aplicacion-reglas.controller';

describe('AplicacionReglasController', () => {
  let controller: AplicacionReglasController  ;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AplicacionReglasController ]
      ,
    }).compile();

    controller = module.get<AplicacionReglasController  >(AplicacionReglasController );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
