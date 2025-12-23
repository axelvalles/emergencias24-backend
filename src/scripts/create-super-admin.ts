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

    // Check if super admin already exists
    const existingSuperAdmin = await userRepository.findOne({
      where: { role: UserRole.ADMIN },
    });

    if (existingSuperAdmin) {
      console.log('Super admin already exists:', existingSuperAdmin.email);
      await AppDataSource.destroy();
      return;
    }

    // Crear usuario
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(rawPassword, saltRounds);

    const superAdmin = userRepository.create({
      email,
      passwordHash: passwordHash,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      firstName: firstName,
      lastName: lastName,
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
