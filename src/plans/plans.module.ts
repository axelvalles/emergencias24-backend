import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Benefit } from '../benefits/entities/benefit.entity';
import { Plan } from './entities/plan.entity';
import { PlanBenefit } from './entities/plan-benefit.entity';
import { PlanSubscription } from './entities/plan-subscription.entity';
import { PlansService } from './services/plans.service';
import { PlansController } from './plans.controller';
import { PlanSubscriptionsController } from './plan-subscriptions.controller';
import { PlanSubscriptionsService } from './services/plan-subscriptions.service';
import { Patient } from '../patients/entities/patient.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Benefit,
      Plan,
      PlanBenefit,
      PlanSubscription,
      Patient,
    ]),
  ],
  controllers: [PlansController, PlanSubscriptionsController],
  providers: [PlansService, PlanSubscriptionsService],
  exports: [PlansService, PlanSubscriptionsService],
})
export class PlansModule {}
