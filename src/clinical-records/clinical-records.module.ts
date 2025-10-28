import { Module } from '@nestjs/common';
import { ClinicalRecordsService } from './clinical-records.service';
import { ClinicalRecordsController } from './clinical-records.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClinicalRecord } from './entities/clinical-record.entity';
import { DoctorsModule } from '../doctors/doctors.module';

@Module({
  imports: [TypeOrmModule.forFeature([ClinicalRecord]), DoctorsModule],
  controllers: [ClinicalRecordsController],
  providers: [ClinicalRecordsService],
  exports: [ClinicalRecordsService],
})
export class ClinicalRecordsModule {}
