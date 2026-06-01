import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import type { ClassConstructor } from 'class-transformer';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class ValidationPipe implements PipeTransform<unknown> {
  async transform(value: unknown, { metatype }: ArgumentMetadata) {
    if (
      !metatype ||
      !this.toValidate(metatype) ||
      typeof value !== 'object' ||
      value === null
    ) {
      return value;
    }

    const object = plainToInstance(metatype as ClassConstructor<object>, value);
    const errors = await validate(object);

    if (errors.length > 0) {
      const messages = errors.map((error) => {
        return Object.values(error.constraints || {}).join(', ');
      });
      throw new BadRequestException(
        `Validation failed: ${messages.join('; ')}`,
      );
    }

    return value;
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  private toValidate(metatype: Function): boolean {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}
