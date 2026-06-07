import { PartialType } from '@nestjs/mapped-types';
import { CreateAmbulanceUnitDto } from './create-ambulance-unit.dto';

export class UpdateAmbulanceUnitDto extends PartialType(CreateAmbulanceUnitDto) {}
