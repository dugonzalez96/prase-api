import { Test, TestingModule } from '@nestjs/testing';
import { CoberturaDeducibleService} from './cobertura-deducible.service';

describe('CoberturaDeducibleService  ', () => {
  let service: CoberturaDeducibleService  ;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CoberturaDeducibleService],
    }).compile();

    service = module.get<CoberturaDeducibleService>(CoberturaDeducibleService  );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
