import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AmbulanceUnitsController } from './ambulance-units.controller';
import { AmbulanceUnitsService } from './ambulance-units.service';
import { AmbulanceUnit } from './entities/ambulance-unit.entity';
import { User } from 'src/users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AmbulanceUnit, User])],
  controllers: [AmbulanceUnitsController],
  providers: [AmbulanceUnitsService],
  exports: [AmbulanceUnitsService],
})
export class AmbulanceUnitsModule {}
