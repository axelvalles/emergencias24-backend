import { Injectable } from '@nestjs/common';
import { CreateClinicalRecordDto } from './dto/create-clinical-record.dto';
import { UpdateClinicalRecordDto } from './dto/update-clinical-record.dto';

@Injectable()
export class ClinicalRecordsService {
  create(createClinicalRecordDto: CreateClinicalRecordDto) {
    return 'This action adds a new clinicalRecord';
  }

  findAll() {
    return `This action returns all clinicalRecords`;
  }

  findOne(id: number) {
    return `This action returns a #${id} clinicalRecord`;
  }

  update(id: number, updateClinicalRecordDto: UpdateClinicalRecordDto) {
    return `This action updates a #${id} clinicalRecord`;
  }

  remove(id: number) {
    return `This action removes a #${id} clinicalRecord`;
  }
}
