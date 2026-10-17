import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';
import { AddContractBeneficiaryDto } from './dto/add-contract-beneficiary.dto';
import { CreatePlanContractDto } from './dto/create-plan-contract.dto';
import { QueryPlanContractsDto } from './dto/query-plan-contracts.dto';
import { PlanContractsService } from './services/plan-contracts.service';

@Controller('plan-contracts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PlanContractsController {
  constructor(private readonly planContractsService: PlanContractsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  create(@Body() dto: CreatePlanContractDto) {
    return this.planContractsService.create(dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  findAll(@Query() query: QueryPlanContractsDto) {
    return this.planContractsService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  findOne(@Param('id') id: string) {
    return this.planContractsService.findOne(id);
  }

  @Post(':id/beneficiaries')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  addBeneficiary(
    @Param('id') id: string,
    @Body() dto: AddContractBeneficiaryDto,
  ) {
    return this.planContractsService.addBeneficiary(id, dto);
  }

  @Delete(':id/beneficiaries/:patientId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  removeBeneficiary(
    @Param('id') id: string,
    @Param('patientId') patientId: string,
  ) {
    return this.planContractsService.removeBeneficiary(id, patientId);
  }
}
