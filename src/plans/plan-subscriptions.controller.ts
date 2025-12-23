import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PlanSubscriptionsService } from './services/plan-subscriptions.service';
import { CreatePlanSubscriptionDto } from './dto/create-plan-subscription.dto';
import { UpdatePlanSubscriptionDto } from './dto/update-plan-subscription.dto';
import { QueryPlanSubscriptionsDto } from './dto/query-plan-subscriptions.dto';
import { AssignFamilyMemberDto } from './dto/assign-family-member.dto';
import { ValidateFamilyMemberDto } from './dto/validate-family-member.dto';

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

  /**
   * Assigns a family member to an existing family plan subscription.
   * Creates a new subscription for the family member linked to the main subscriber.
   */
  @Post('family-members')
  assignFamilyMember(@Body() assignFamilyMemberDto: AssignFamilyMemberDto) {
    return this.planSubscriptionsService.assignFamilyMember(
      assignFamilyMemberDto,
    );
  }

  /**
   * Gets all family members assigned to a family plan subscription.
   */
  @Get(':id/family-members')
  getFamilyMembers(@Param('id') id: string) {
    return this.planSubscriptionsService.getFamilyMembers(id);
  }

  /**
   * Removes a family member from a family plan.
   * This deletes the family member's subscription.
   */
  @Delete('family-members/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeFamilyMember(@Param('id') id: string) {
    return this.planSubscriptionsService.removeFamilyMember(id);
  }

  /**
   * Gets all active plan subscriptions for a patient.
   */
  @Get('patient/:patientId/active')
  findActiveByPatientId(@Param('patientId') patientId: string) {
    return this.planSubscriptionsService.findActiveByPatientId(patientId);
  }

  /**
   * Validates if a person (by document number) is eligible to be a family member.
   * Checks if they are not already part of any family plan.
   */
  @Post('validate-family-member')
  validateFamilyMember(
    @Body() validateFamilyMemberDto: ValidateFamilyMemberDto,
  ) {
    return this.planSubscriptionsService.validateFamilyMemberEligibility(
      validateFamilyMemberDto,
    );
  }
}
