import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { PlansService } from './services/plans.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { QueryPlansDto } from './dto/query-plans.dto';

@Controller('plans')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  create(@Body() createPlanDto: CreatePlanDto) {
    return this.plansService.create(createPlanDto);
  }

@Get()
  @Roles(UserRole.ADMIN, UserRole.DISPATCHER, UserRole.SUPER_ADMIN)
  findAll(@Query() query: QueryPlansDto) {
    return this.plansService.findAll(query);
  }

@Get(':id')
  @Roles(UserRole.ADMIN, UserRole.DISPATCHER, UserRole.SUPER_ADMIN)
  findOne(@Param('id') id: string) {
    return this.plansService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  update(@Param('id') id: string, @Body() updatePlanDto: UpdatePlanDto) {
    return this.plansService.update(id, updatePlanDto);
  }

  @Put(':id/deactivate')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  deactivate(@Param('id') id: string) {
    return this.plansService.deactivate(id);
  }

  @Put(':id/activate')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  activate(@Param('id') id: string) {
    return this.plansService.activate(id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  remove(@Param('id') id: string) {
    return this.plansService.remove(id);
  }
}
