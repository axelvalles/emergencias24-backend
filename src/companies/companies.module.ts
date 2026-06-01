import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from './entities/company.entity';
import { Patient } from '../patients/entities/patient.entity';
import { CompaniesService } from './services/companies.service';
import { CompaniesController } from './companies.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Company, Patient])],
  controllers: [CompaniesController],
  providers: [CompaniesService],
  exports: [CompaniesService, TypeOrmModule],
})
export class CompaniesModule {}
