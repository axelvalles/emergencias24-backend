import { PartialType } from '@nestjs/mapped-types';
import { CreatePlanSubscriptionDto } from './create-plan-subscription.dto';

export class UpdatePlanSubscriptionDto extends PartialType(
  CreatePlanSubscriptionDto,
) {}
