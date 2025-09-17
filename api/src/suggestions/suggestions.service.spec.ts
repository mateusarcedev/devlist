import { Test, TestingModule } from '@nestjs/testing';
import { SuggestionsService } from './suggestions.service';
import { PrismaService } from 'src/prisma/prisma.service';

describe('SuggestionsService', () => {
  let service: SuggestionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuggestionsService,
        {
          provide: PrismaService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<SuggestionsService>(SuggestionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
