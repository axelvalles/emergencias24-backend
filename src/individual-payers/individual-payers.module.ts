import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Patient } from '../patients/entities/patient.entity';
import { IndividualPayer } from './entities/individual-payer.entity';
import { IndividualPayersController } from './individual-payers.controller';
import { IndividualPayersService } from './individual-payers.service';

@Module({
  imports: [TypeOrmModule.forFeature([IndividualPayer, Patient])],
  controllers: [IndividualPayersController],
  providers: [IndividualPayersService],
  exports: [IndividualPayersService],
})
export class IndividualPayersModule {}
