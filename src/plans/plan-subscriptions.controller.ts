import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { PlanSubscriptionsService } from './services/plan-subscriptions.service';
import {
  PlanSubscription,
  PlanSubscriptionRole,
} from './entities/plan-subscription.entity';

@Controller('plan-subscriptions')
export class PlanSubscriptionsController {
  constructor(
    private readonly planSubscriptionsService: PlanSubscriptionsService,
  ) {}

  @Post()
  create(@Body() createPlanSubscriptionDto: Partial<PlanSubscription>) {
    return this.planSubscriptionsService.create(createPlanSubscriptionDto);
  }

  @Get()
  findAll() {
    return this.planSubscriptionsService.findAll();
  }

  @Get('patient/:patientId')
  findByPatient(@Param('patientId') patientId: string) {
    return this.planSubscriptionsService.findByPatient(patientId);
  }

  @Get('group/:groupId')
  findByPlanGroup(@Param('groupId') groupId: string) {
    return this.planSubscriptionsService.findByPlanGroup(groupId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.planSubscriptionsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePlanSubscriptionDto: Partial<PlanSubscription>,
  ) {
    return this.planSubscriptionsService.update(id, updatePlanSubscriptionDto);
  }

  @Post('subscribe')
  subscribe(
    @Body()
    body: {
      planGroupId: string;
      patientId: string;
      role?: PlanSubscriptionRole;
      startDate?: Date;
      endDate?: Date;
    },
  ) {
    return this.planSubscriptionsService.subscribePatient(
      body.planGroupId,
      body.patientId,
      body.role,
      body.startDate,
      body.endDate,
    );
  }

  @Delete('unsubscribe/:groupId/:patientId')
  unsubscribe(
    @Param('groupId') groupId: string,
    @Param('patientId') patientId: string,
  ) {
    return this.planSubscriptionsService.unsubscribePatient(groupId, patientId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.planSubscriptionsService.remove(id);
  }
}
