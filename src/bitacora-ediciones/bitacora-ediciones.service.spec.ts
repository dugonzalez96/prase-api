import { Test, TestingModule } from '@nestjs/testing';
import { BitacoraEdicionesService } from './bitacora-ediciones.service';

describe('BitacoraEdicionesService', () => {
  let service: BitacoraEdicionesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BitacoraEdicionesService],
    }).compile();

    service = module.get<BitacoraEdicionesService>(BitacoraEdicionesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
