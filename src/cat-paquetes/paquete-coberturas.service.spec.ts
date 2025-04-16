import { Test, TestingModule } from '@nestjs/testing';
import { PaqueteCoberturasService } from './paquete-coberturas.service';

describe('PaqueteCoberturasService', () => {
  let service: PaqueteCoberturasService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PaqueteCoberturasService],
    }).compile();

    service = module.get<PaqueteCoberturasService>(PaqueteCoberturasService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
