import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MunicipalityPricingController } from './municipality-pricing.controller';
import { MunicipalityPricingService } from './municipality-pricing.service';
import { MunicipalityPricing } from './entities/municipality-pricing.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MunicipalityPricing])],
  controllers: [MunicipalityPricingController],
  providers: [MunicipalityPricingService],
  exports: [MunicipalityPricingService],
})
export class MunicipalityPricingModule {}
