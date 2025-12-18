import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { QueryPatientsDto } from './dto/query-patients.dto';
import { UpdatePatientStatusDto } from './dto/update-patient-status.dto';

@Controller('patients')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  @Roles(UserRole.CLINIC_ADMIN, UserRole.SUPER_ADMIN)
  create(@Body() createPatientDto: CreatePatientDto) {
    return this.patientsService.create(createPatientDto);
  }

  @Get()
  @Roles(UserRole.CLINIC_ADMIN, UserRole.SUPER_ADMIN)
  findAll(
    @Query(
      new ValidationPipe({
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    )
    query: QueryPatientsDto,
  ) {
    return this.patientsService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.CLINIC_ADMIN, UserRole.SUPER_ADMIN)
  findOne(@Param('id') id: string) {
    return this.patientsService.findOne(id);
  }

  @Get('by-document/:document')
  @Roles(UserRole.CLINIC_ADMIN, UserRole.SUPER_ADMIN)
  findByDocument(@Param('document') document: string) {
    return this.patientsService.findByDocument(document);
  }

  @Patch(':id')
  @Roles(UserRole.CLINIC_ADMIN, UserRole.SUPER_ADMIN)
  update(@Param('id') id: string, @Body() updatePatientDto: UpdatePatientDto) {
    return this.patientsService.update(id, updatePatientDto);
  }

  @Patch(':id/status')
  @Roles(UserRole.CLINIC_ADMIN, UserRole.SUPER_ADMIN)
  updateStatus(
    @Param('id') id: string,
    @Body() updatePatientStatusDto: UpdatePatientStatusDto,
  ) {
    return this.patientsService.updateStatus(id, updatePatientStatusDto.status);
  }

  @Delete(':id')
  @Roles(UserRole.CLINIC_ADMIN, UserRole.SUPER_ADMIN)
  remove(@Param('id') id: string) {
    return this.patientsService.remove(id);
  }
}
