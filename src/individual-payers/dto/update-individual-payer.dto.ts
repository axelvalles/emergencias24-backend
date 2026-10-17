import { PartialType } from '@nestjs/mapped-types';
import { CreateIndividualPayerDto } from './create-individual-payer.dto';

export class UpdateIndividualPayerDto extends PartialType(
  CreateIndividualPayerDto,
  { skipNullProperties: false },
) {}
