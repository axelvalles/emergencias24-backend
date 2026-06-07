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
  Res,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { PatientsService } from './patients.service';
import { PatientsImportService } from './patients-import.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { QueryPatientsDto } from './dto/query-patients.dto';
import { UpdatePatientStatusDto } from './dto/update-patient-status.dto';
import {
  PatientImportErrorCode,
  PatientImportException,
} from './exeptions/patient-import.exception';

@Controller('patients')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PatientsController {
  constructor(
    private readonly patientsService: PatientsService,
    private readonly patientsImportService: PatientsImportService,
  ) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  create(@Body() createPatientDto: CreatePatientDto) {
    return this.patientsService.create(createPatientDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.DISPATCHER, UserRole.SUPER_ADMIN)
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
  @Roles(UserRole.ADMIN, UserRole.DISPATCHER, UserRole.SUPER_ADMIN)
  findOne(@Param('id') id: string) {
    return this.patientsService.findOne(id);
  }

  @Get('by-document/:document')
  @Roles(UserRole.ADMIN, UserRole.DISPATCHER, UserRole.SUPER_ADMIN)
  findByDocument(@Param('document') document: string) {
    return this.patientsService.findByDocument(document);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  update(@Param('id') id: string, @Body() updatePatientDto: UpdatePatientDto) {
    return this.patientsService.update(id, updatePatientDto);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  updateStatus(
    @Param('id') id: string,
    @Body() updatePatientStatusDto: UpdatePatientStatusDto,
  ) {
    return this.patientsService.updateStatus(id, updatePatientStatusDto.status);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  remove(@Param('id') id: string) {
    return this.patientsService.remove(id);
  }

  @Get('import/template')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async generateImportTemplate(@Res() res: Response) {
    await this.patientsImportService.generateTemplate(res);
  }

  @Post('import')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
      },
      fileFilter: (req, file, cb) => {
        const allowedMimeTypes = [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
          'text/csv',
        ];

        if (!allowedMimeTypes.includes(file.mimetype)) {
          cb(
            new PatientImportException(
              'Only .xlsx files are allowed',
              PatientImportErrorCode.INVALID_FILE_FORMAT,
            ),
            false,
          );
        } else {
          cb(null, true);
        }
      },
    }),
  )
  async importPatients(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    return this.patientsImportService.importPatients(file);
  }
}
