import { PartialType } from '@nestjs/mapped-types';
import { CreatePlanGroupDto } from './create-plan-group.dto';

export class UpdatePlanGroupDto extends PartialType(CreatePlanGroupDto) {}
