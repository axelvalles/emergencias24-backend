import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { BenefitsService } from './benefits.service';
import { CreateBenefitDto } from './dto/create-benefit.dto';
import { QueryBenefitsDto } from './dto/query-benefits.dto';
import { UpdateBenefitDto } from './dto/update-benefit.dto';

@Controller('benefits')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BenefitsController {
  constructor(private readonly benefitsService: BenefitsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() createBenefitDto: CreateBenefitDto) {
    return this.benefitsService.create(createBenefitDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
  findAll(@Query() query: QueryBenefitsDto) {
    return this.benefitsService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
  findOne(@Param('id') id: string) {
    return this.benefitsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() updateBenefitDto: UpdateBenefitDto) {
    return this.benefitsService.update(id, updateBenefitDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.benefitsService.remove(id);
  }
}
