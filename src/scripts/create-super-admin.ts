import * as bcrypt from 'bcrypt';

import { User, UserRole, UserStatus } from '../users/entities/user.entity';

import AppDataSource from '../config/typeorm.config';

async function main() {
  // Cambia los valores por lo que quieras

  const email = process.env.SUPERUSER_EMAIL || '';

  const rawPassword = process.env.SUPERUSER_PASSWORD || '';

  const firstName = process.env.SUPERUSER_FIRSTNAME || '';

  const lastName = process.env.SUPERUSER_LASTNAME || '';

  if (!email || !rawPassword || !firstName || !lastName) {
    console.error(
      'Missing required environment variables: SUPERUSER_EMAIL, SUPERUSER_PASSWORD, SUPERUSER_FIRSTNAME, SUPERUSER_LASTNAME',
    );

    process.exit(1);
  }

  try {
    // Initialize database connection

    await AppDataSource.initialize();

    console.log('Database connection established');

    const userRepository = AppDataSource.getRepository(User);

    const saltRounds = 10;

    const passwordHash = await bcrypt.hash(rawPassword, saltRounds);

    // If configured email exists, enforce admin + active + updated credentials

    const existingByEmail = await userRepository.findOne({
      where: { email },
    });

    if (existingByEmail) {
      existingByEmail.passwordHash = passwordHash;

      existingByEmail.role = UserRole.SUPER_ADMIN;

      existingByEmail.status = UserStatus.ACTIVE;

      existingByEmail.firstName = firstName;

      existingByEmail.lastName = lastName;

      existingByEmail.phone = process.env.SUPERUSER_PHONE || null;

      await userRepository.save(existingByEmail);

      console.log('Super admin reactivated/updated:', existingByEmail.email);

      await AppDataSource.destroy();

      return;
    }

    // Fallback: if another admin already exists, keep it and also create configured admin

    const existingSuperAdmin = await userRepository.findOne({
       where: { role: UserRole.SUPER_ADMIN },
    });

    if (existingSuperAdmin) {
      console.log('Another admin already exists:', existingSuperAdmin.email);

      console.log('Creating configured super admin:', email);
    }

    const superAdmin = userRepository.create({
      email,

      passwordHash,

       role: UserRole.SUPER_ADMIN,

      status: UserStatus.ACTIVE,

      firstName,

      lastName,

      phone: process.env.SUPERUSER_PHONE || null,
    });

    await userRepository.save(superAdmin);

    console.log('Super admin created successfully:', superAdmin.email);

    await AppDataSource.destroy();

    console.log('Database connection closed');
  } catch (error) {
    console.error('Error creating super admin:', error);

    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Error creating superuser:', err);

  process.exit(1);
});
