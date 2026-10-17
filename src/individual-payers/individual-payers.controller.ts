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
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';
import { CreateIndividualPayerDto } from './dto/create-individual-payer.dto';
import { QueryIndividualPayersDto } from './dto/query-individual-payers.dto';
import { UpdateIndividualPayerDto } from './dto/update-individual-payer.dto';
import { IndividualPayersService } from './individual-payers.service';

@Controller('individual-payers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class IndividualPayersController {
  constructor(
    private readonly individualPayersService: IndividualPayersService,
  ) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  create(@Body() dto: CreateIndividualPayerDto) {
    return this.individualPayersService.create(dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  findAll(@Query() query: QueryIndividualPayersDto) {
    return this.individualPayersService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  findOne(@Param('id') id: string) {
    return this.individualPayersService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateIndividualPayerDto) {
    return this.individualPayersService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  remove(@Param('id') id: string) {
    return this.individualPayersService.remove(id);
  }
}
