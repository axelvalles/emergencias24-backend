import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { PlanSubscriptionsService } from './services/plan-subscriptions.service';
import { CreatePlanSubscriptionDto } from './dto/create-plan-subscription.dto';
import { UpdatePlanSubscriptionDto } from './dto/update-plan-subscription.dto';
import { QueryPlanSubscriptionsDto } from './dto/query-plan-subscriptions.dto';

@Controller('plan-subscriptions')
export class PlanSubscriptionsController {
  constructor(
    private readonly planSubscriptionsService: PlanSubscriptionsService,
  ) {}

  @Post()
  create(@Body() createPlanSubscriptionDto: CreatePlanSubscriptionDto) {
    return this.planSubscriptionsService.create(createPlanSubscriptionDto);
  }

  @Get()
  findAll(@Query() query: QueryPlanSubscriptionsDto) {
    return this.planSubscriptionsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.planSubscriptionsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePlanSubscriptionDto: UpdatePlanSubscriptionDto,
  ) {
    return this.planSubscriptionsService.update(id, updatePlanSubscriptionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.planSubscriptionsService.remove(id);
  }
}
