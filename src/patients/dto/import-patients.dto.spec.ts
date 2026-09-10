import { validate } from 'class-validator';
import { ImportPatientsDto } from './import-patients.dto';

describe('ImportPatientsDto', () => {
  it('accepts UUIDv7 identifiers for the selected company and plan', async () => {
    const dto = Object.assign(new ImportPatientsDto(), {
      companyId: '019e79f9-9941-758b-9bd2-18f4d1da9148',
      planId: '019e79f9-9941-758b-9bd2-18f4d1da9149',
    });

    await expect(validate(dto)).resolves.toEqual([]);
  });

  it('requires valid UUIDs for the selected company and plan', async () => {
    const dto = Object.assign(new ImportPatientsDto(), {
      companyId: 'not-a-uuid',
      planId: '',
    });

    const errors = await validate(dto);

    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining(['companyId', 'planId']),
    );
  });
});
