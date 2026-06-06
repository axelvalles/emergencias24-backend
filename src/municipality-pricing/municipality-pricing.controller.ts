import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/users/entities/user.entity';
import { MunicipalityPricingService } from './municipality-pricing.service';
import { UpdateMunicipalityPricingDto } from './dto/update-municipality-pricing.dto';

@Controller('municipality-pricing')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MunicipalityPricingController {
  constructor(
    private readonly municipalityPricingService: MunicipalityPricingService,
  ) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN)
  findAll() {
    return this.municipalityPricingService.findAll();
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateMunicipalityPricingDto: UpdateMunicipalityPricingDto,
  ) {
    return this.municipalityPricingService.update(
      id,
      updateMunicipalityPricingDto,
    );
  }
}
