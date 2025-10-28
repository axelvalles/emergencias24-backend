import { Test, TestingModule } from '@nestjs/testing';
import { ClinicalRecordsService } from './clinical-records.service';

describe('ClinicalRecordsService', () => {
  let service: ClinicalRecordsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ClinicalRecordsService],
    }).compile();

    service = module.get<ClinicalRecordsService>(ClinicalRecordsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
