import { Test, TestingModule } from '@nestjs/testing';
import { BitacoraEliminacionesService } from './bitacora-eliminaciones.service';

describe('BitacoraEliminacionesService', () => {
  let service: BitacoraEliminacionesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BitacoraEliminacionesService],
    }).compile();

    service = module.get<BitacoraEliminacionesService>(BitacoraEliminacionesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
