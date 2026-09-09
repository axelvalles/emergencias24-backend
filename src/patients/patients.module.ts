import { Module } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { PatientsController } from './patients.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Patient } from './entities/patient.entity';
import { CompaniesModule } from '../companies/companies.module';
import { PatientsImportService } from './patients-import.service';

@Module({
  imports: [TypeOrmModule.forFeature([Patient]), CompaniesModule],
  controllers: [PatientsController],
  providers: [PatientsService, PatientsImportService],
  exports: [PatientsService],
})
export class PatientsModule {}
