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
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { PlanSubscriptionsService } from './services/plan-subscriptions.service';
import { CreatePlanSubscriptionDto } from './dto/create-plan-subscription.dto';
import { UpdatePlanSubscriptionDto } from './dto/update-plan-subscription.dto';
import { QueryPlanSubscriptionsDto } from './dto/query-plan-subscriptions.dto';
import { AssignFamilyMemberDto } from './dto/assign-family-member.dto';
import { ValidateFamilyMemberDto } from './dto/validate-family-member.dto';

@Controller('plan-subscriptions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PlanSubscriptionsController {
  constructor(
    private readonly planSubscriptionsService: PlanSubscriptionsService,
  ) {}

@Post()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  create(@Body() createPlanSubscriptionDto: CreatePlanSubscriptionDto) {
    return this.planSubscriptionsService.create(createPlanSubscriptionDto);
  }

@Get()
  @Roles(UserRole.ADMIN, UserRole.DISPATCHER, UserRole.SUPER_ADMIN)
  findAll(@Query() query: QueryPlanSubscriptionsDto) {
    return this.planSubscriptionsService.findAll(query);
  }

@Get(':id')
  @Roles(UserRole.ADMIN, UserRole.DISPATCHER, UserRole.SUPER_ADMIN)
  findOne(@Param('id') id: string) {
    return this.planSubscriptionsService.findOne(id);
  }

@Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  update(
    @Param('id') id: string,
    @Body() updatePlanSubscriptionDto: UpdatePlanSubscriptionDto,
  ) {
    return this.planSubscriptionsService.update(id, updatePlanSubscriptionDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.planSubscriptionsService.remove(id);
  }

  /**
   * Assigns a family member to an existing family plan subscription.
   * Creates a new subscription for the family member linked to the main subscriber.
   */
@Post('family-members')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  assignFamilyMember(@Body() assignFamilyMemberDto: AssignFamilyMemberDto) {
    return this.planSubscriptionsService.assignFamilyMember(
      assignFamilyMemberDto,
    );
  }

  /**
   * Gets all family members assigned to a family plan subscription.
   */
@Get(':id/family-members')
  @Roles(UserRole.ADMIN, UserRole.DISPATCHER, UserRole.SUPER_ADMIN)
  getFamilyMembers(@Param('id') id: string) {
    return this.planSubscriptionsService.getFamilyMembers(id);
  }

  /**
   * Removes a family member from a family plan.
   * This deletes the family member's subscription.
   */
@Delete('family-members/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  removeFamilyMember(@Param('id') id: string) {
    return this.planSubscriptionsService.removeFamilyMember(id);
  }

  /**
   * Gets all active plan subscriptions for a patient.
   */
@Get('patient/:patientId/active')
  @Roles(UserRole.ADMIN, UserRole.DISPATCHER, UserRole.SUPER_ADMIN)
  findActiveByPatientId(@Param('patientId') patientId: string) {
    return this.planSubscriptionsService.findActiveByPatientId(patientId);
  }

  /**
   * Validates if a person (by document number) is eligible to be a family member.
   * Checks if they are not already part of any family plan.
   */
@Post('validate-family-member')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  validateFamilyMember(
    @Body() validateFamilyMemberDto: ValidateFamilyMemberDto,
  ) {
    return this.planSubscriptionsService.validateFamilyMemberEligibility(
      validateFamilyMemberDto,
    );
  }
}
