import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Plan } from './entities/plan.entity';
import { PlanGroup } from './entities/plan-group.entity';
import { PlanSubscription } from './entities/plan-subscription.entity';
import { PlansService } from './services/plans.service';
import { PlanGroupsService } from './services/plan-groups.service';
import { PlanSubscriptionsService } from './services/plan-subscriptions.service';
import { PlansController } from './plans.controller';
import { PlanGroupsController } from './plan-groups.controller';
import { PlanSubscriptionsController } from './plan-subscriptions.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Plan, PlanGroup, PlanSubscription])],
  controllers: [
    PlansController,
    PlanGroupsController,
    PlanSubscriptionsController,
  ],
  providers: [PlansService, PlanGroupsService, PlanSubscriptionsService],
  exports: [PlansService, PlanGroupsService, PlanSubscriptionsService],
})
export class PlansModule {}
