import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlanBenefit } from '../plans/entities/plan-benefit.entity';
import { BenefitsController } from './benefits.controller';
import { BenefitsService } from './benefits.service';
import { Benefit } from './entities/benefit.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Benefit, PlanBenefit])],
  controllers: [BenefitsController],
  providers: [BenefitsService],
  exports: [BenefitsService],
})
export class BenefitsModule {}
