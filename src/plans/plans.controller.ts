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
} from '@nestjs/common';
import { PlansService } from './services/plans.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { QueryPlansDto } from './dto/query-plans.dto';

@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Post()
  create(@Body() createPlanDto: CreatePlanDto) {
    return this.plansService.create(createPlanDto);
  }

  @Get()
  findAll(@Query() query: QueryPlansDto) {
    return this.plansService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.plansService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePlanDto: UpdatePlanDto) {
    return this.plansService.update(id, updatePlanDto);
  }

  @Put(':id/deactivate')
  deactivate(@Param('id') id: string) {
    return this.plansService.deactivate(id);
  }

  @Put(':id/activate')
  activate(@Param('id') id: string) {
    return this.plansService.activate(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.plansService.remove(id);
  }
}
