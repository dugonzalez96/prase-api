import { Test, TestingModule } from '@nestjs/testing';
import { DeduciblesService  } from './deducibles.service';

describe('DeduciblesService ', () => {
  let service: DeduciblesService ;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DeduciblesService ],
    }).compile();

    service = module.get<DeduciblesService >(DeduciblesService );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
