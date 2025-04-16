import { Test, TestingModule } from '@nestjs/testing';
import { CoberturasService } from './coberturas.service';

describe('CoberturasService', () => {
  let service: CoberturasService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CoberturasService],
    }).compile();

    service = module.get<CoberturasService>(CoberturasService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
