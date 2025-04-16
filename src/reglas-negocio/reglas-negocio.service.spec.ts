import { Test, TestingModule } from '@nestjs/testing';
import { ReglasNegocioService   } from './reglas-negocio.service';

describe('ReglasNegocioService ', () => {
  let service: ReglasNegocioService ;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReglasNegocioService ],
    }).compile();

    service = module.get<ReglasNegocioService >(ReglasNegocioService );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
