import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceType } from 'src/tickets/entities/ticket.entity';
import { MunicipalityPricing } from './entities/municipality-pricing.entity';
import { UpdateMunicipalityPricingDto } from './dto/update-municipality-pricing.dto';

@Injectable()
export class MunicipalityPricingService {
  constructor(
    @InjectRepository(MunicipalityPricing)
    private readonly municipalityPricingRepository: Repository<MunicipalityPricing>,
  ) {}

  async findAll(): Promise<MunicipalityPricing[]> {
    return this.municipalityPricingRepository.find({
      order: {
        displayOrder: 'ASC',
        municipality: 'ASC',
      },
    });
  }

  async findOne(id: string): Promise<MunicipalityPricing> {
    const pricing = await this.municipalityPricingRepository.findOne({
      where: { id },
    });

    if (!pricing) {
      throw new NotFoundException(
        `Configuración de precios con ID ${id} no encontrada`,
      );
    }

    return pricing;
  }

  async update(
    id: string,
    updateMunicipalityPricingDto: UpdateMunicipalityPricingDto,
  ): Promise<MunicipalityPricing> {
    const pricing = await this.findOne(id);

    if (typeof updateMunicipalityPricingDto.homeCarePrice === 'number') {
      pricing.homeCarePrice =
        updateMunicipalityPricingDto.homeCarePrice.toFixed(2);
    }

    if (typeof updateMunicipalityPricingDto.ambulancePrice === 'number') {
      pricing.ambulancePrice =
        updateMunicipalityPricingDto.ambulancePrice.toFixed(2);
    }

    return this.municipalityPricingRepository.save(pricing);
  }

  async getCostByMunicipality(
    serviceType: ServiceType.HOME_CARE | ServiceType.AMBULANCE,
    municipality: string,
  ): Promise<number | null> {
    const pricing = await this.municipalityPricingRepository
      .createQueryBuilder('pricing')
      .where('LOWER(pricing.municipality) = LOWER(:municipality)', {
        municipality: municipality.trim(),
      })
      .getOne();

    if (!pricing) {
      return null;
    }

    const cost =
      serviceType === ServiceType.HOME_CARE
        ? pricing.homeCarePrice
        : pricing.ambulancePrice;

    return Number(cost);
  }
}
