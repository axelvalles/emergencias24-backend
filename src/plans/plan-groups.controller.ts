import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { PlanGroupsService } from './services/plan-groups.service';
import { CreatePlanGroupDto } from './dto/create-plan-group.dto';
import { UpdatePlanGroupDto } from './dto/update-plan-group.dto';

@Controller('plan-groups')
export class PlanGroupsController {
  constructor(private readonly planGroupsService: PlanGroupsService) {}

  @Post()
  create(@Body() createPlanGroupDto: CreatePlanGroupDto) {
    return this.planGroupsService.create(createPlanGroupDto);
  }

  @Get()
  findAll() {
    return this.planGroupsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.planGroupsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePlanGroupDto: UpdatePlanGroupDto,
  ) {
    return this.planGroupsService.update(id, updatePlanGroupDto);
  }

  @Post(':id/members')
  addMember(
    @Param('id') id: string,
    @Body() body: { patientId: string; startDate?: Date; endDate?: Date },
  ) {
    return this.planGroupsService.addMember(
      id,
      body.patientId,
      body.startDate,
      body.endDate,
    );
  }

  @Delete(':id/members/:patientId')
  removeMember(@Param('id') id: string, @Param('patientId') patientId: string) {
    return this.planGroupsService.removeMember(id, patientId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.planGroupsService.remove(id);
  }
}
