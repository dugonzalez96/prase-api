import { Test, TestingModule } from '@nestjs/testing';
import { CondicionesReglasService } from './condiciones-reglas.service';

describe('CondicionesReglasService ', () => {
  let service: CondicionesReglasService ;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CondicionesReglasService ],
    }).compile();

    service = module.get<CondicionesReglasService >(CondicionesReglasService );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
