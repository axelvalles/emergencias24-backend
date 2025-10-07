import { Test, TestingModule } from '@nestjs/testing';
import { ClinicalRecordsController } from './clinical-records.controller';
import { ClinicalRecordsService } from './clinical-records.service';

describe('ClinicalRecordsController', () => {
  let controller: ClinicalRecordsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClinicalRecordsController],
      providers: [ClinicalRecordsService],
    }).compile();

    controller = module.get<ClinicalRecordsController>(ClinicalRecordsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
