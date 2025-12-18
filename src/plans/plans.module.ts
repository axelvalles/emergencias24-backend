import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Plan } from './entities/plan.entity';
import { PlanSubscription } from './entities/plan-subscription.entity';
import { PlansService } from './services/plans.service';
import { PlansController } from './plans.controller';
import { PlanSubscriptionsController } from './plan-subscriptions.controller';
import { PlanSubscriptionsService } from './services/plan-subscriptions.service';

@Module({
  imports: [TypeOrmModule.forFeature([Plan, PlanSubscription])],
  controllers: [PlansController, PlanSubscriptionsController],
  providers: [PlansService, PlanSubscriptionsService],
  exports: [PlansService, PlanSubscriptionsService],
})
export class PlansModule {}
