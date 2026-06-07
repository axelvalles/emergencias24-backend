import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Patient } from '../patients/entities/patient.entity';
import { AmbulanceUnit } from 'src/ambulance-units/entities/ambulance-unit.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Patient, AmbulanceUnit])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
