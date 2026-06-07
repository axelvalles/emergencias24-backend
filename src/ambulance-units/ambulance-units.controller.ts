import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { AmbulanceUnitsService } from './ambulance-units.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { User, UserRole } from 'src/users/entities/user.entity';
import { CreateAmbulanceUnitDto } from './dto/create-ambulance-unit.dto';
import { UpdateAmbulanceUnitDto } from './dto/update-ambulance-unit.dto';
import { SearchAmbulanceUnitDto } from './dto/search-ambulance-unit.dto';

@Controller('ambulance-units')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AmbulanceUnitsController {
  constructor(private readonly ambulanceUnitsService: AmbulanceUnitsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() createAmbulanceUnitDto: CreateAmbulanceUnitDto) {
    return this.ambulanceUnitsService.create(createAmbulanceUnitDto);
  }

  @Get('search')
  @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
  search(
    @Query(
      new ValidationPipe({
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    )
    query: SearchAmbulanceUnitDto,
  ) {
    return this.ambulanceUnitsService.search(query);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
  findAll() {
    return this.ambulanceUnitsService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
  findOne(@Param('id') id: string) {
    return this.ambulanceUnitsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateAmbulanceUnitDto: UpdateAmbulanceUnitDto,
  ) {
    return this.ambulanceUnitsService.update(id, updateAmbulanceUnitDto);
  }

  @Patch('active/:id')
  @Roles(UserRole.AMBULANCE)
  setActiveUnit(@GetUser() user: User, @Param('id') id: string) {
    return this.ambulanceUnitsService.setActiveUnit(user, id);
  }
}
